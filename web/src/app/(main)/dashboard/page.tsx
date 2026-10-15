"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  fetchCourses,
  fetchStudentRecommendations,
  fetchStudentProfile,
  Course,
  StudentRecommendation,
  StudentProfileResponse,
} from "@/lib/api"
import { StudentDashboard } from "@/components/dashboard/StudentDashboard"
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard"

export default function DashboardPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [recommendations, setRecommendations] = useState<StudentRecommendation[]>([])
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      fetchCourses().then(setCourses).catch(() => []),
      user.role === "STUDENT"
        ? fetchStudentRecommendations()
            .then((r) => setRecommendations(r.recommendations))
            .catch(() => [])
        : Promise.resolve([]),
      user.role === "STUDENT"
        ? fetchStudentProfile()
            .then(setProfile)
            .catch(() => null)
        : Promise.resolve(null),
    ]).finally(() => setLoading(false))
  }, [user])

  if (!user) return null

  if (user.role === "TEACHER") {
    return (
      <TeacherDashboard
        userName={user.name || user.email}
        courses={courses}
        loading={loading}
      />
    )
  }

  return (
    <StudentDashboard
      userName={user.name || user.email}
      courses={courses}
      recommendations={recommendations}
      profile={profile}
      loading={loading}
    />
  )
}
