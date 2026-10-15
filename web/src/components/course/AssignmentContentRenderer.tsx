"use client"

import React, { useMemo } from "react"

interface AssignmentContentRendererProps {
  content: string
  assignmentTitle?: string
}

interface ParsedSection {
  type: "description" | "instructions" | "submission" | "rubric" | "tips" | "general"
  rawTitle: string
  cleanTitle: string
  content: string
}

/**
 * Format inline markdown elements (**bold**, *italic*, `code`, URLs) into React elements.
 */
function renderInlineFormatted(text: string): React.ReactNode {
  const tokens: React.ReactNode[] = []
  let remaining = text
  let keyIdx = 0

  while (remaining.length > 0) {
    // Look for code: `code`
    const codeMatch = remaining.match(/`([^`]+)`/)
    // Look for bold: **bold**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    // Look for italic: *italic* or _italic_
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)|_([^_]+)_/)

    // Find the earliest match
    const matches = [
      codeMatch ? { type: "code", index: codeMatch.index!, match: codeMatch } : null,
      boldMatch ? { type: "bold", index: boldMatch.index!, match: boldMatch } : null,
      italicMatch ? { type: "italic", index: italicMatch.index!, match: italicMatch } : null,
    ].filter(Boolean) as Array<{
      type: "code" | "bold" | "italic"
      index: number
      match: RegExpMatchArray
    }>

    if (matches.length === 0) {
      tokens.push(remaining)
      break
    }

    matches.sort((a, b) => a.index - b.index)
    const first = matches[0]

    // Push text preceding the match
    if (first.index > 0) {
      tokens.push(remaining.substring(0, first.index))
    }

    if (first.type === "code") {
      tokens.push(
        <code
          key={`c-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded-md bg-zinc-100 text-brand-800 text-[11px] font-mono border border-zinc-200"
        >
          {first.match[1]}
        </code>
      )
      remaining = remaining.substring(first.index + first.match[0].length)
    } else if (first.type === "bold") {
      tokens.push(
        <strong key={`b-${keyIdx++}`} className="font-semibold text-zinc-900">
          {first.match[1]}
        </strong>
      )
      remaining = remaining.substring(first.index + first.match[0].length)
    } else if (first.type === "italic") {
      const val = first.match[1] || first.match[2]
      tokens.push(
        <em key={`i-${keyIdx++}`} className="italic text-zinc-800">
          {val}
        </em>
      )
      remaining = remaining.substring(first.index + first.match[0].length)
    }
  }

  return tokens
}

/**
 * Render paragraphs and code blocks cleanly, stripping markdown horizontal rules.
 */
function renderParagraphsOrCode(text: string): React.ReactNode {
  // Filter out horizontal rules (e.g. ---, ***, ___)
  const cleanLines = text
    .split("\n")
    .filter((l) => !/^\s*([*-=_])\s*\1\s*\1+\s*$/.test(l.trim()))
  const cleanText = cleanLines.join("\n")

  // Split by code blocks ```...```
  const parts = cleanText.split(/(```[\s\S]*?```)/g)

  return parts.map((part, pIdx) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.slice(3, -3)
      const firstNewline = inner.indexOf("\n")
      const lang = firstNewline !== -1 ? inner.slice(0, firstNewline).trim() : ""
      const code = firstNewline !== -1 ? inner.slice(firstNewline + 1) : inner

      return (
        <div key={pIdx} className="my-2.5 rounded-xl overflow-hidden border border-zinc-200 shadow-2xs">
          {lang && (
            <div className="bg-zinc-800 px-3 py-1 text-[10px] font-mono text-zinc-300 border-b border-zinc-700 uppercase tracking-wider font-semibold">
              {lang}
            </div>
          )}
          <pre className="p-3 bg-zinc-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      )
    }

    const paragraphs = part.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    return (
      <div key={pIdx} className="space-y-2">
        {paragraphs.map((para, paraIdx) => (
          <p key={paraIdx} className="leading-relaxed">
            {renderInlineFormatted(para.trim())}
          </p>
        ))}
      </div>
    )
  })
}

export function AssignmentContentRenderer({
  content,
  assignmentTitle,
}: AssignmentContentRendererProps) {
  // Parse content into structured sections based on markdown headings
  const sections = useMemo<ParsedSection[]>(() => {
    if (!content || !content.trim()) return []

    let raw = content.trim()

    // 1. Strip top-level # [Title] (format pagar level 1)
    raw = raw.replace(/^\s*#\s+[^\n]+(\r?\n)*/, "").trim()

    // 2. Split by ## or ### or #### headings
    const headingRegex = /^#{2,4}\s+(.+)$/gm
    const matches: Array<{ title: string; index: number; length: number }> = []

    let match: RegExpExecArray | null
    while ((match = headingRegex.exec(raw)) !== null) {
      matches.push({
        title: match[1].trim(),
        index: match.index,
        length: match[0].length,
      })
    }

    // If no headings found, return single general section
    if (matches.length === 0) {
      return [
        {
          type: "general",
          rawTitle: "",
          cleanTitle: "",
          content: raw,
        },
      ]
    }

    const parsed: ParsedSection[] = []

    // If there is intro content before first heading
    if (matches[0].index > 0) {
      const intro = raw.substring(0, matches[0].index).trim()
      if (intro) {
        parsed.push({
          type: "description",
          rawTitle: "Deskripsi",
          cleanTitle: "Deskripsi & Latar Belakang",
          content: intro,
        })
      }
    }

    for (let i = 0; i < matches.length; i++) {
      const curr = matches[i]
      const startIndex = curr.index + curr.length
      const endIndex = i + 1 < matches.length ? matches[i + 1].index : raw.length
      const sectionBody = raw.substring(startIndex, endIndex).trim()

      const titleLower = curr.title.toLowerCase()
      let type: ParsedSection["type"] = "general"

      if (
        titleLower.includes("deskripsi") ||
        titleLower.includes("latar belakang") ||
        titleLower.includes("overview") ||
        titleLower.includes("ringkasan")
      ) {
        type = "description"
      } else if (
        titleLower.includes("instruksi") ||
        titleLower.includes("langkah") ||
        titleLower.includes("tahapan") ||
        titleLower.includes("pengerjaan")
      ) {
        type = "instructions"
      } else if (
        titleLower.includes("pengumpulan") ||
        titleLower.includes("format berkas") ||
        titleLower.includes("ketentuan") ||
        titleLower.includes("penamaan")
      ) {
        type = "submission"
      } else if (
        titleLower.includes("rubrik") ||
        titleLower.includes("penilaian") ||
        titleLower.includes("kriteria") ||
        titleLower.includes("bobot")
      ) {
        type = "rubric"
      } else if (
        titleLower.includes("tips") ||
        titleLower.includes("saran") ||
        titleLower.includes("catatan") ||
        titleLower.includes("rekomendasi")
      ) {
        type = "tips"
      }

      parsed.push({
        type,
        rawTitle: curr.title,
        cleanTitle: curr.title,
        content: sectionBody,
      })
    }

    return parsed
  }, [content])

  if (!content || !content.trim()) {
    return null
  }

  return (
    <div className="space-y-3.5 text-xs text-zinc-800">
      {sections.map((section, idx) => {
        switch (section.type) {
          case "description":
            return (
              <div
                key={idx}
                className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center gap-2 text-slate-800 font-bold font-heading text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center text-[11px]">
                    📖
                  </span>
                  <span>{section.cleanTitle || "Deskripsi & Latar Belakang"}</span>
                </div>
                <div className="text-zinc-700 leading-relaxed text-xs">
                  {renderParagraphsOrCode(section.content)}
                </div>
              </div>
            )

          case "instructions": {
            // Split steps by lines starting with numbers or bullets
            const rawLines = section.content.split("\n").filter((l) => l.trim().length > 0)
            const steps: Array<{ number?: string; title?: string; body: string; subItems: string[] }> = []

            let currentStep: { number?: string; title?: string; body: string; subItems: string[] } | null = null

            for (const line of rawLines) {
              const trimmed = line.trim()
              if (/^\s*([*-=_])\s*\1\s*\1+\s*$/.test(trimmed)) continue

              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
              const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/)

              if (numMatch) {
                if (currentStep) steps.push(currentStep)
                const fullText = numMatch[2]
                // Check if starts with bold title **Title:** rest
                const boldTitleMatch = fullText.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)$/)
                if (boldTitleMatch) {
                  currentStep = {
                    number: numMatch[1],
                    title: boldTitleMatch[1].replace(/[:\s-]+$/, "").trim(),
                    body: boldTitleMatch[2],
                    subItems: [],
                  }
                } else {
                  currentStep = {
                    number: numMatch[1],
                    body: fullText,
                    subItems: [],
                  }
                }
              } else if (bulletMatch) {
                if (currentStep) {
                  currentStep.subItems.push(bulletMatch[1])
                } else {
                  currentStep = {
                    body: bulletMatch[1],
                    subItems: [],
                  }
                }
              } else {
                if (currentStep) {
                  currentStep.body += ` ${trimmed}`
                } else {
                  currentStep = {
                    body: trimmed,
                    subItems: [],
                  }
                }
              }
            }
            if (currentStep) steps.push(currentStep)

            return (
              <div
                key={idx}
                className="bg-sky-50/50 rounded-xl p-4 border border-sky-200/80 shadow-2xs space-y-3"
              >
                <div className="flex items-center gap-2 text-sky-900 font-bold font-heading text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center text-[11px]">
                    📝
                  </span>
                  <span>{section.cleanTitle || "Instruksi Pengerjaan (Langkah demi langkah)"}</span>
                </div>

                <div className="space-y-2.5">
                  {steps.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-sky-100 shadow-2xs"
                    >
                      {step.number && (
                        <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          {step.number}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        {step.title && (
                          <h6 className="font-bold text-xs text-zinc-900">
                            {renderInlineFormatted(step.title)}
                          </h6>
                        )}
                        {step.body && (
                          <p className="text-zinc-700 text-xs leading-relaxed">
                            {renderInlineFormatted(step.body)}
                          </p>
                        )}
                        {step.subItems && step.subItems.length > 0 && (
                          <ul className="space-y-1 pt-1.5 border-t border-sky-50 pl-1">
                            {step.subItems.map((sub, subIdx) => (
                              <li key={subIdx} className="flex items-start gap-2 text-[11px] text-zinc-600">
                                <span className="text-sky-500 font-bold mt-0.5">•</span>
                                <span className="leading-relaxed">{renderInlineFormatted(sub)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          case "submission": {
            // Parse items like * **Bahasa Pemrograman:** Bebas (C++, Java, atau Python).
            const rawLines = section.content.split("\n").filter((l) => l.trim().length > 0)
            const items: Array<{ label?: string; value: string; icon: string }> = []

            for (const line of rawLines) {
              const trimmed = line.trim()
              if (/^\s*([*-=_])\s*\1\s*\1+\s*$/.test(trimmed)) continue

              const clean = trimmed.replace(/^[-*]\s+/, "").trim()
              const match = clean.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)$/)
              let label: string | undefined
              let value: string

              if (match) {
                label = match[1].replace(/[:\s-]+$/, "").trim()
                value = match[2].trim()
              } else {
                const colonIdx = clean.indexOf(":")
                if (colonIdx !== -1) {
                  label = clean.substring(0, colonIdx).trim()
                  value = clean.substring(colonIdx + 1).trim()
                } else {
                  value = clean
                }
              }

              // Pick smart icon for category
              let icon = "📋"
              const lblLower = (label || "").toLowerCase()
              if (lblLower.includes("bahasa") || lblLower.includes("program") || lblLower.includes("tools")) {
                icon = "💻"
              } else if (lblLower.includes("format") || lblLower.includes("tipe") || lblLower.includes("ekstensi") || lblLower.includes("berkas")) {
                icon = "📁"
              } else if (lblLower.includes("nama") || lblLower.includes("penamaan")) {
                icon = "🏷️"
              } else if (lblLower.includes("waktu") || lblLower.includes("batas") || lblLower.includes("deadline")) {
                icon = "⏰"
              }

              items.push({ label, value, icon })
            }

            return (
              <div
                key={idx}
                className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200/80 shadow-2xs space-y-3"
              >
                <div className="flex items-center gap-2 text-emerald-900 font-bold font-heading text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px]">
                    📦
                  </span>
                  <span>{section.cleanTitle || "Ketentuan Pengumpulan & Format Berkas"}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="p-3 rounded-lg bg-white border border-emerald-100/90 shadow-2xs space-y-1 flex items-start gap-2.5"
                    >
                      <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        {item.label && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                            {item.label}
                          </span>
                        )}
                        <p className="text-xs text-zinc-800 font-medium leading-relaxed">
                          {renderInlineFormatted(item.value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          case "rubric": {
            // Parse items like * **Ketepatan Algoritma & Logika (30%):** Alur program berjalan... OR Markdown Table
            const rawLines = section.content.split("\n").filter((l) => l.trim().length > 0)
            const criteria: Array<{ title: string; weight?: string; desc: string }> = []

            for (const line of rawLines) {
              const trimmed = line.trim()
              if (/^\s*([*-=_])\s*\1\s*\1+\s*$/.test(trimmed)) continue

              // Table row format | Kriteria | Bobot | Deskripsi |
              if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
                if (/^[|\s-:]+$/.test(trimmed)) continue
                const cells = trimmed.split("|").slice(1, -1).map((c) => c.trim())
                if (cells.length >= 2) {
                  const c0Lower = cells[0].toLowerCase()
                  const c1Lower = cells[1].toLowerCase()
                  if (c0Lower.includes("kriteria") || c1Lower.includes("bobot") || c0Lower.includes("komponen")) {
                    continue
                  }
                  const weightCell = cells.find((c) => /^\d+%$/.test(c)) || (cells[1].includes("%") ? cells[1] : undefined)
                  const descCell = cells.length > 2 ? cells[2] : (!cells[1].includes("%") ? cells[1] : "")
                  criteria.push({
                    title: cells[0],
                    weight: weightCell,
                    desc: descCell,
                  })
                }
                continue
              }

              // Bullet item format
              const clean = trimmed.replace(/^[-*]\s+/, "").trim()
              const boldMatch = clean.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)$/)

              if (boldMatch) {
                const boldText = boldMatch[1].trim()
                const restText = boldMatch[2].trim()

                const pctMatch = boldText.match(/\(?(\d+%)\)?/) || restText.match(/^[:\s]*\(?(\d+%)\)?[:\s-]*/)
                const weight = pctMatch ? pctMatch[1] : undefined

                const cleanTitle = boldText
                  .replace(/\s*\(?\d+%\)?/, "")
                  .replace(/[:\s-]+$/, "")
                  .trim()

                let cleanDesc = restText
                if (pctMatch && restText.startsWith(pctMatch[0])) {
                  cleanDesc = restText.substring(pctMatch[0].length).trim()
                }

                criteria.push({
                  title: cleanTitle || boldText,
                  weight,
                  desc: cleanDesc,
                })
              } else {
                const pctMatch = clean.match(/\(?(\d+%)\)?/)
                const weight = pctMatch ? pctMatch[1] : undefined
                const cleanText = clean.replace(/\s*\(?\d+%\)?/, "").trim()
                const colonIdx = cleanText.indexOf(":")
                if (colonIdx !== -1) {
                  criteria.push({
                    title: cleanText.substring(0, colonIdx).trim(),
                    weight,
                    desc: cleanText.substring(colonIdx + 1).trim(),
                  })
                } else {
                  criteria.push({
                    title: cleanText,
                    weight,
                    desc: "",
                  })
                }
              }
            }

            return (
              <div
                key={idx}
                className="bg-purple-50/50 rounded-xl p-4 border border-purple-200/80 shadow-2xs space-y-3"
              >
                <div className="flex items-center gap-2 text-purple-900 font-bold font-heading text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-[11px]">
                    📊
                  </span>
                  <span>{section.cleanTitle || "Rubrik / Kriteria Penilaian"}</span>
                </div>

                <div className="space-y-2">
                  {criteria.map((crit, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-3 bg-white rounded-lg border border-purple-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-zinc-900">
                            {renderInlineFormatted(crit.title)}
                          </span>
                        </div>
                        {crit.desc && (
                          <p className="text-[11px] text-zinc-600 leading-relaxed">
                            {renderInlineFormatted(crit.desc)}
                          </p>
                        )}
                      </div>

                      {crit.weight && (
                        <div className="px-2.5 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-[11px] font-bold shrink-0 self-start sm:self-auto shadow-2xs">
                          Bobot: {crit.weight}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          case "tips": {
            const rawLines = section.content.split("\n").filter((l) => l.trim().length > 0)
            const tips = rawLines
              .filter((l) => !/^\s*([*-=_])\s*\1\s*\1+\s*$/.test(l.trim()))
              .map((l) => l.replace(/^[-*]\s+/, "").trim())

            return (
              <div
                key={idx}
                className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/80 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center gap-2 text-amber-900 font-bold font-heading text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-[11px]">
                    💡
                  </span>
                  <span>{section.cleanTitle || "Tips & Saran Pengerjaan"}</span>
                </div>

                <div className="space-y-1.5">
                  {tips.map((tip, tIdx) => (
                    <div key={tIdx} className="flex items-start gap-2 text-xs text-amber-950">
                      <span className="text-amber-500 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{renderInlineFormatted(tip)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          default:
            return (
              <div
                key={idx}
                className="bg-zinc-50/80 rounded-xl p-4 border border-zinc-200/80 shadow-2xs space-y-2.5"
              >
                {section.cleanTitle && (
                  <h6 className="font-bold text-xs text-zinc-800 uppercase tracking-wider font-heading">
                    {section.cleanTitle}
                  </h6>
                )}
                <div className="text-zinc-700 leading-relaxed text-xs">
                  {renderParagraphsOrCode(section.content)}
                </div>
              </div>
            )
        }
      })}
    </div>
  )
}
