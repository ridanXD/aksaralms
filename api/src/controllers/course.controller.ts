import { Response, NextFunction } from "express"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../config/database"
import { z } from "zod"

// ─── Course ──────────────────────────────────────────────

export async function listCourses(req: AuthRequest, res: Response) {
  const courses = await prisma.course.findMany({
    where:
      req.user!.role === "TEACHER"
        ? { teacherId: req.user!.id }
        : { enrollments: { some: { userId: req.user!.id } } },
    include: {
      _count: {
        select: { modules: true, enrollments: true, assignments: true },
      },
    },
  })

  res.json(courses)
}

export async function getCourse(req: AuthRequest, res: Response) {
  const course = await prisma.course.findUnique({
    where: { id: parseInt(req.params.courseId) },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { materials: { orderBy: { order: "asc" } } },
      },
      enrollments: { include: { user: { select: { id: true, name: true, email: true } } } },
      assignments: true,
    },
  })

  if (!course) return res.status(404).json({ error: "Course not found" })

  const isEnrolled = course.enrollments.some((e) => e.userId === req.user!.id)
  const isTeacher = course.teacherId === req.user!.id

  if (req.user!.role !== "TEACHER" && !isEnrolled && !isTeacher) {
    return res.status(403).json({ error: "Not enrolled in this course" })
  }

  // Compute progress for students
  let progressPct = 0
  if (!isTeacher) {
    const totalMaterials = course.modules.reduce(
      (sum, m) => sum + (m.materials?.length ?? 0),
      0
    )
    if (totalMaterials > 0) {
      const completed = await prisma.progress.count({
        where: {
          userId: req.user!.id,
          material: {
            module: { courseId: course.id },
          },
          completed: true,
        },
      })
      progressPct = Math.round((completed / totalMaterials) * 100)
    }
  }

  res.json({ ...course, progressPct: isTeacher ? null : progressPct })
}

const createCourseSchema = z.object({
  title: z.string().min(1, "Judul mata kuliah wajib diisi"),
  description: z.string().optional(),
  code: z.string().min(2, "Kode kelas minimal 2 karakter").max(25, "Kode kelas maksimal 25 karakter").optional(),
})

export async function checkCourseCode(req: AuthRequest, res: Response) {
  try {
    const rawCode = ((req.query.code as string) || "").trim().toUpperCase()
    const excludeId = req.query.excludeId ? parseInt(req.query.excludeId as string) : undefined

    if (!rawCode) {
      return res.status(400).json({ error: "Kode kelas tidak boleh kosong" })
    }

    const existing = await prisma.course.findFirst({
      where: {
        code: rawCode,
        ...(excludeId && !isNaN(excludeId) ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, title: true, code: true },
    })

    if (existing) {
      return res.json({
        available: false,
        code: rawCode,
        message: `Kode kelas '${rawCode}' sudah digunakan. Silakan ganti kode lain.`,
      })
    }

    return res.json({
      available: true,
      code: rawCode,
      message: `Kode kelas '${rawCode}' tersedia.`,
    })
  } catch (err) {
    res.status(500).json({ error: "Gagal memeriksa kode kelas" })
  }
}

export async function createCourse(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createCourseSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0]?.message || "Input tidak valid" })
    }

    let code = parsed.data.code?.trim().toUpperCase()
    if (code) {
      const existing = await prisma.course.findUnique({ where: { code } })
      if (existing) {
        return res.status(400).json({
          error: `Kode kelas '${code}' sudah digunakan. Silakan ganti kode lain.`,
          codeTaken: true,
        })
      }
    } else {
      let unique = false
      while (!unique) {
        code = "CRS" + Math.random().toString(36).substring(2, 8).toUpperCase()
        const existing = await prisma.course.findUnique({ where: { code } })
        if (!existing) unique = true
      }
    }

    const course = await prisma.course.create({
      data: {
        title: parsed.data.title.trim(),
        description: parsed.data.description?.trim() || null,
        code,
        teacherId: req.user!.id,
      },
      include: {
        _count: {
          select: { modules: true, enrollments: true, assignments: true },
        },
      },
    })

    res.status(201).json(course)
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(400).json({
        error: "Kode kelas sudah digunakan. Silakan ganti kode lain.",
        codeTaken: true,
      })
    }
    next(err)
  }
}

export async function updateCourse(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const courseId = parseInt(req.params.courseId)
    if (isNaN(courseId)) {
      return res.status(400).json({ error: "ID kelas tidak valid" })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return res.status(404).json({ error: "Kelas tidak ditemukan" })
    if (course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: "Hanya dosen pengampu yang dapat mengubah kelas ini" })
    }

    const parsed = createCourseSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0]?.message || "Input tidak valid" })
    }

    let newCode = parsed.data.code ? parsed.data.code.trim().toUpperCase() : course.code
    if (newCode !== course.code) {
      const existing = await prisma.course.findFirst({
        where: { code: newCode, id: { not: courseId } },
      })
      if (existing) {
        return res.status(400).json({
          error: `Kode kelas '${newCode}' sudah digunakan. Silakan ganti kode lain.`,
          codeTaken: true,
        })
      }
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: parsed.data.title.trim(),
        description: parsed.data.description?.trim() || null,
        code: newCode,
      },
      include: {
        _count: {
          select: { modules: true, enrollments: true, assignments: true },
        },
      },
    })

    res.json(updated)
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(400).json({
        error: "Kode kelas sudah digunakan. Silakan ganti kode lain.",
        codeTaken: true,
      })
    }
    next(err)
  }
}

export async function enroll(req: AuthRequest, res: Response) {
  const param = req.params.courseId
  const id = parseInt(param)
  const course = isNaN(id)
    ? await prisma.course.findUnique({ where: { code: param } })
    : await prisma.course.findUnique({ where: { id } })
  if (!course) return res.status(404).json({ error: "Course not found" })

  const exists = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.user!.id, courseId: course.id } },
  })
  if (exists) return res.json({ message: "Already enrolled" })

  await prisma.enrollment.create({
    data: { userId: req.user!.id, courseId: course.id },
  })

  res.status(201).json({ message: "Enrolled successfully" })
}

// ─── Module ──────────────────────────────────────────────

const createModuleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().optional(),
})

export async function createModule(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createModuleSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })

    const course = await prisma.course.findUnique({ where: { id: parseInt(req.params.courseId) } })
    if (!course) return res.status(404).json({ error: "Course not found" })
    if (course.teacherId !== req.user!.id) return res.status(403).json({ error: "Not the teacher" })

    const mod = await prisma.module.create({
      data: {
        courseId: course.id,
        title: parsed.data.title,
        description: parsed.data.description,
        order: parsed.data.order ?? 0,
      },
    })

    res.status(201).json(mod)
  } catch (err) {
    next(err)
  }
}

// ─── Material ────────────────────────────────────────────

const createMaterialSchema = z.object({
  moduleId: z.coerce.number().optional(),
  title: z.string().min(1, "Judul materi wajib diisi"),
  type: z.enum(["TEXT", "VIDEO", "IMAGE", "FILE"]).default("TEXT"),
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  order: z.number().optional(),
})

export async function createMaterial(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createMaterialSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0]?.message || "Input tidak valid" })
    }

    const courseId = parseInt(req.params.courseId)
    if (isNaN(courseId)) {
      return res.status(400).json({ error: "ID kelas mata kuliah tidak valid" })
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { orderBy: { order: "asc" } } },
    })
    if (!course) return res.status(404).json({ error: "Mata kuliah tidak ditemukan" })
    if (course.teacherId !== req.user!.id) return res.status(403).json({ error: "Bukan pengampu kelas ini" })

    // Determine target module
    let moduleId = parseInt(req.params.moduleId || String(parsed.data.moduleId || ""))
    if (isNaN(moduleId)) {
      if (course.modules.length > 0) {
        moduleId = course.modules[0].id
      } else {
        const defaultModule = await prisma.module.create({
          data: {
            courseId: course.id,
            title: "Modul 1: Bahan Ajar Perkuliahan",
            description: "Modul silabus pembelajaran",
            order: 0,
          },
        })
        moduleId = defaultModule.id
      }
    }

    const targetModule = await prisma.module.findUnique({ where: { id: moduleId } })
    if (!targetModule || targetModule.courseId !== course.id) {
      return res.status(404).json({ error: "Modul tidak ditemukan pada kelas ini" })
    }

    const materialCount = await prisma.material.count({ where: { moduleId } })

    const material = await prisma.material.create({
      data: {
        moduleId: targetModule.id,
        title: parsed.data.title.trim(),
        type: parsed.data.type,
        content: parsed.data.content?.trim() || null,
        fileUrl: parsed.data.fileUrl?.trim() || null,
        order: parsed.data.order ?? materialCount,
      },
    })

    res.status(201).json(material)
  } catch (err) {
    next(err)
  }
}

// ─── Progress ────────────────────────────────────────────

export async function markProgress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const materialId = parseInt(req.params.materialId)
    const completed = req.body.completed ?? true

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: { module: { include: { course: true } } },
    })
    if (!material) return res.status(404).json({ error: "Material not found" })

    const enrolled = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user!.id,
          courseId: material.module.courseId,
        },
      },
    })
    if (!enrolled) return res.status(403).json({ error: "Not enrolled" })

    const progress = await prisma.progress.upsert({
      where: { userId_materialId: { userId: req.user!.id, materialId: materialId } },
      update: { completed },
      create: { userId: req.user!.id, materialId, completed },
    })

    res.json(progress)
  } catch (err) {
    next(err)
  }
}

export async function getProgress(req: AuthRequest, res: Response) {
  const progress = await prisma.progress.findMany({
    where: { userId: req.user!.id },
    include: {
      material: { include: { module: { select: { id: true, title: true } } } },
    },
  })
  res.json(progress)
}
