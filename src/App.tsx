import {
  useEffect,
  useState,
} from "react"

import {
  Plus,
  Trash2,
  Check,
  Folder,
  X,
  Undo2,
  Redo2,
} from "lucide-react"

import type {
  Note,
  Project,
} from "./types"

const STORAGE_KEY =
  "zraw-checklist-projects"

function createDefaultProject(): Project {
  const now = Date.now()

  return {
    id: crypto.randomUUID(),

    name: "Checklist 1",

    notes: [
      {
        id: crypto.randomUUID(),
        text: 'ตอนเปิดคลิป Text ตามคำพูด "',
        completed: true,
        createdAt: now,
      },

      {
        id: crypto.randomUUID(),
        text: "00:04 ใส่ Text ชื่อร้าน",
        completed: true,
        createdAt: now,
      },

      {
        id: crypto.randomUUID(),
        text: '00:08 ใส่ Text "เปิด 25 กันยายนนี้"',
        completed: false,
        createdAt: now,
      },

      {
        id: crypto.randomUUID(),
        text: "00:17 ใส่ Text  + เพิ่มเพลง",
        completed: false,
        createdAt: now,
      },

      {
        id: crypto.randomUUID(),
        text: "00:29 ตัดตอนพูดซ้ำ",
        completed: true,
        createdAt: now,
      },
    ],

    createdAt: now,
  }
}

function loadProjects(): Project[] {
  try {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      )

    if (saved) {
      const parsed =
        JSON.parse(saved)

      if (
        Array.isArray(parsed) &&
        parsed.length > 0
      ) {
        return parsed
      }
    }
  } catch (error) {
    console.error(
      "Failed to load projects:",
      error
    )
  }

  return [createDefaultProject()]
}

function App() {
  // ==================================================
  // PROJECT DATA
  // ==================================================

  const [
    projects,
    setProjects,
  ] = useState<Project[]>(
    loadProjects
  )

  const [
    currentProjectId,
    setCurrentProjectId,
  ] = useState<string>(() => {
    const loaded =
      loadProjects()

    return loaded[0]?.id ?? ""
  })

  // ==================================================
  // UNDO / REDO
  // ==================================================

  const [
    history,
    setHistory,
  ] = useState<Project[][]>([])

  const [
    future,
    setFuture,
  ] = useState<Project[][]>([])

  // ==================================================
  // UI STATE
  // ==================================================

  const [
    newNote,
    setNewNote,
  ] = useState("")

  const [
    showNewProject,
    setShowNewProject,
  ] = useState(false)

  const [
    newProjectName,
    setNewProjectName,
  ] = useState("")

  // ==================================================
  // SAVE TO LOCAL STORAGE
  // ==================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(projects)
      )
    } catch (error) {
      console.error(
        "Failed to save projects:",
        error
      )
    }
  }, [projects])

  // ==================================================
  // MAKE SURE CURRENT PROJECT EXISTS
  // ==================================================

  useEffect(() => {
    const exists =
      projects.some(
        (project) =>
          project.id ===
          currentProjectId
      )

    if (
      !exists &&
      projects.length > 0
    ) {
      setCurrentProjectId(
        projects[0].id
      )
    }
  }, [
    projects,
    currentProjectId,
  ])

  // ==================================================
  // CURRENT PROJECT
  // ==================================================

  const currentProject =
    projects.find(
      (project) =>
        project.id ===
        currentProjectId
    )

  // ==================================================
  // COMMIT CHANGE
  //
  // ทุกการเปลี่ยนแปลงที่ต้องการ Undo
  // ต้องผ่าน function นี้
  // ==================================================

  const commitProjects = (
    nextProjects: Project[]
  ) => {
    setHistory(
      (currentHistory) => [
        ...currentHistory,
        projects,
      ]
    )

    setFuture([])

    setProjects(nextProjects)
  }

  // ==================================================
  // UNDO
  // ==================================================

  const undo = () => {
    if (history.length === 0) {
      return
    }

    const previousState =
      history[
        history.length - 1
      ]

    setHistory(
      history.slice(0, -1)
    )

    setFuture(
      (currentFuture) => [
        projects,
        ...currentFuture,
      ]
    )

    setProjects(
      previousState
    )
  }

  // ==================================================
  // REDO
  // ==================================================

  const redo = () => {
    if (future.length === 0) {
      return
    }

    const nextState =
      future[0]

    setFuture(
      future.slice(1)
    )

    setHistory(
      (currentHistory) => [
        ...currentHistory,
        projects,
      ]
    )

    setProjects(nextState)
  }

  // ==================================================
  // ELECTRON MENU
  //
  // File → New Project
  // Edit → Undo
  // Edit → Redo
  // ==================================================

  useEffect(() => {
    if (!window.electronAPI) {
      return
    }

    const removeNewProject =
      window.electronAPI.newProject(
        () => {
          setShowNewProject(true)
        }
      )

    const removeUndo =
      window.electronAPI.undo(() => {
        undo()
      })

    const removeRedo =
      window.electronAPI.redo(() => {
        redo()
      })

    return () => {
      removeNewProject()
      removeUndo()
      removeRedo()
    }
  }, [
    history,
    future,
    projects,
  ])

  // ==================================================
  // KEYBOARD SHORTCUT
  //
  // Ctrl + Z       = Undo
  // Ctrl + Shift Z = Redo
  // ==================================================

  useEffect(() => {
    const handleKeyboard = (
      event: KeyboardEvent
    ) => {
      const modifier =
        event.ctrlKey ||
        event.metaKey

      if (!modifier) {
        return
      }

      // Undo / Redo
      if (
        event.key.toLowerCase() ===
        "z"
      ) {
        event.preventDefault()

        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }

        return
      }

      // Ctrl + N
      if (
        event.key.toLowerCase() ===
        "n"
      ) {
        event.preventDefault()

        setShowNewProject(true)

        return
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyboard
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      )
    }
  }, [
    history,
    future,
    projects,
  ])

  // ==================================================
  // UPDATE CURRENT PROJECT
  // ==================================================

  const updateCurrentProject = (
    updatedNotes: Note[]
  ) => {
    if (!currentProject) {
      return
    }

    const nextProjects =
      projects.map(
        (project) =>
          project.id ===
          currentProjectId
            ? {
                ...project,
                notes:
                  updatedNotes,
              }
            : project
      )

    commitProjects(
      nextProjects
    )
  }

  // ==================================================
  // TOGGLE NOTE
  // ==================================================

  const toggleNote = (
    noteId: string
  ) => {
    if (!currentProject) {
      return
    }

    const updatedNotes =
      currentProject.notes.map(
        (note) =>
          note.id === noteId
            ? {
                ...note,
                completed:
                  !note.completed,
              }
            : note
      )

    updateCurrentProject(
      updatedNotes
    )
  }

  // ==================================================
  // ADD NOTE
  // ==================================================

  const addNote = () => {
    if (!currentProject) {
      return
    }

    const text =
      newNote.trim()

    if (!text) {
      return
    }

    const note: Note = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
    }

    updateCurrentProject([
      ...currentProject.notes,
      note,
    ])

    setNewNote("")
  }

  // ==================================================
  // DELETE NOTE
  // ==================================================

  const deleteNote = (
    noteId: string
  ) => {
    if (!currentProject) {
      return
    }

    const updatedNotes =
      currentProject.notes.filter(
        (note) =>
          note.id !== noteId
      )

    updateCurrentProject(
      updatedNotes
    )
  }

  // ==================================================
  // CREATE PROJECT
  // ==================================================

  const createProject = () => {
    const name =
      newProjectName.trim()

    if (!name) {
      return
    }

    const newProject: Project = {
      id: crypto.randomUUID(),

      name,

      notes: [],

      createdAt: Date.now(),
    }

    const nextProjects = [
      ...projects,
      newProject,
    ]

    commitProjects(
      nextProjects
    )

    setCurrentProjectId(
      newProject.id
    )

    setNewProjectName("")

    setShowNewProject(false)
  }

  // ==================================================
  // DELETE PROJECT
  // ==================================================

  const deleteProject = (
    projectId: string
  ) => {
    // ห้ามลบ Project สุดท้าย
    if (projects.length <= 1) {
      return
    }

    const projectIndex =
      projects.findIndex(
        (project) =>
          project.id ===
          projectId
      )

    const remainingProjects =
      projects.filter(
        (project) =>
          project.id !==
          projectId
      )

    // Save history
    commitProjects(
      remainingProjects
    )

    // ถ้าลบ Project ที่กำลังเปิดอยู่
    if (
      projectId ===
      currentProjectId
    ) {
      const nextIndex =
        Math.min(
          projectIndex,
          remainingProjects.length -
            1
        )

      setCurrentProjectId(
        remainingProjects[
          nextIndex
        ]?.id ??
          remainingProjects[0]
            ?.id ??
          ""
      )
    }
  }

  // ==================================================
  // NOTES / PROGRESS
  // ==================================================

  const notes =
    currentProject?.notes ??
    []

  const completedCount =
    notes.filter(
      (note) =>
        note.completed
    ).length

  const progress =
    notes.length === 0
      ? 0
      : Math.round(
          (completedCount /
            notes.length) *
            100
        )

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="min-h-screen bg-neutral-950 text-white">

      <div className="mx-auto flex max-w-6xl">

        {/* ==================================================
            SIDEBAR
        ================================================== */}

        <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-neutral-900 p-5">

          {/* LOGO */}

          <div className="mb-8">

            

            <div className="mt-1 text-[25px] tracking-[0.3em] text-white-700">
              ZRAW
            </div>
            <div className=" text-[10px] tracking-[0.3em] text-neutral-700">
              CHECKLIST 
            </div>
           <div className=" text-[10px] tracking-[0.3em] text-neutral-700">
              BY SIRAWIT 
            </div>
          

          </div>

          {/* PROJECT HEADER */}

          <div className="mb-3 flex items-center justify-between">

            <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              Projects
            </span>

            <button
              onClick={() =>
                setShowNewProject(
                  true
                )
              }
              className="text-neutral-500 transition hover:text-white"
              title="New Project"
            >
              <Plus
                size={17}
              />
            </button>

          </div>

          {/* PROJECT LIST */}

          <div className="space-y-1">

            {projects.map(
              (project) => (

                <div
                  key={project.id}
                  className={`group flex items-center gap-2 rounded-lg px-3 py-2 ${
                    project.id ===
                    currentProjectId
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-500 hover:bg-neutral-900/50 hover:text-white"
                  }`}
                >

                  <button
                    onClick={() =>
                      setCurrentProjectId(
                        project.id
                      )
                    }
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >

                    <Folder
                      size={15}
                    />

                    <div className="min-w-0">
                      <div className="truncate text-sm">
                        {project.name}
                      </div>
                      <div className="mt-0.5 text-[10px] text-neutral-600">
                        {new Date(project.createdAt).toLocaleDateString("th-TH", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                  </button>

                  {projects.length >
                    1 && (

                    <button
                      onClick={() =>
                        deleteProject(
                          project.id
                        )
                      }
                      className="opacity-0 text-neutral-600 transition hover:text-red-400 group-hover:opacity-100"
                      title="Delete Project"
                    >

                      <Trash2
                        size={14}
                      />

                    </button>

                  )}

                </div>

              )
            )}

          </div>

        </aside>

        {/* ==================================================
            MAIN
        ================================================== */}

        <main className="min-w-0 flex-1 px-10 py-10">

          {currentProject && (
            <>

              {/* PROJECT TITLE */}

              <div className="mb-10">

                <div className="mb-2 text-xs uppercase tracking-widest text-neutral-600">
                  Project
                </div>

                <h1 className="text-3xl font-semibold">
                  {currentProject.name}
                </h1>

                <div className="mt-2 text-xs text-neutral-600">
                  Created {new Date(currentProject.createdAt).toLocaleDateString("th-TH", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>

              </div>

              {/* ==================================================
                  PROGRESS
              ================================================== */}

              <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">

                <div className="mb-3 flex items-center justify-between">

                  <span className="text-sm text-neutral-400">
                    Progress
                  </span>

                  <span className="text-sm font-medium">
                    {
                      completedCount
                    }{" "}
                    /{" "}
                    {
                      notes.length
                    }
                  </span>

                </div>

                <div className="h-2 overflow-hidden rounded-full bg-neutral-800">

                  <div
                    className="h-full rounded-full bg-white transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

                <div className="mt-2 text-right text-xs text-neutral-500">
                  {progress}%
                </div>

              </div>

              {/* ==================================================
                  NOTES
              ================================================== */}

              <div className="space-y-2">

                {notes.map(
                  (note) => (

                    <div
                      key={note.id}
                      className="group flex items-start gap-3 rounded-xl border border-neutral-900 p-4 transition hover:border-neutral-700"
                    >

                      {/* CHECKBOX */}

                      <button
                        onClick={() =>
                          toggleNote(
                            note.id
                          )
                        }
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                          note.completed
                            ? "border-white bg-white text-black"
                            : "border-neutral-600 hover:border-white"
                        }`}
                        title={
                          note.completed
                            ? "Mark as incomplete"
                            : "Mark as complete"
                        }
                      >

                        {note.completed && (
                          <Check
                            size={14}
                            strokeWidth={
                              3
                            }
                          />
                        )}

                      </button>

                      {/* TEXT */}

                      <div
                        className={`flex-1 text-sm leading-6 ${
                          note.completed
                            ? "text-neutral-600 line-through"
                            : "text-neutral-200"
                        }`}
                      >
                        {
                          note.text
                        }
                      </div>

                      {/* DELETE */}

                      <button
                        onClick={() =>
                          deleteNote(
                            note.id
                          )
                        }
                        className="opacity-0 text-neutral-600 transition hover:text-red-400 group-hover:opacity-100"
                        title="Delete Note"
                      >

                        <Trash2
                          size={16}
                        />

                      </button>

                    </div>

                  )
                )}

                {/* EMPTY STATE */}

                {notes.length ===
                  0 && (

                  <div className="rounded-xl border border-dashed border-neutral-800 py-12 text-center">

                    <div className="text-sm text-neutral-600">
                      ยังไม่มีโน้ต
                    </div>

                    <div className="mt-1 text-xs text-neutral-700">
                      เพิ่ม Feedback ด้านล่าง
                    </div>

                  </div>

                )}

              </div>

              {/* ==================================================
                  ADD NOTE
              ================================================== */}

              <div className="mt-6 flex gap-2">

                <input
                  value={newNote}
                  onChange={(event) =>
                    setNewNote(
                      event.target
                        .value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      addNote()
                    }
                  }}
                  placeholder="เพิ่มโน้ต..."
                  className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm outline-none placeholder:text-neutral-600 focus:border-neutral-500"
                />

                <button
                  onClick={addNote}
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-neutral-200"
                >

                  <Plus
                    size={17}
                  />

                  เพิ่ม

                </button>

              </div>

              {/* ==================================================
                  UNDO / REDO INDICATOR
              ================================================== */}

              <div className="mt-6 flex items-center gap-2 text-xs text-neutral-700">

                <button
                  onClick={undo}
                  disabled={
                    history.length ===
                    0
                  }
                  className="flex items-center gap-1 transition hover:text-neutral-300 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Undo (Ctrl + Z)"
                >
                  <Undo2
                    size={13}
                  />

                  Undo
                </button>

                <span>
                  /
                </span>

                <button
                  onClick={redo}
                  disabled={
                    future.length ===
                    0
                  }
                  className="flex items-center gap-1 transition hover:text-neutral-300 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Redo (Ctrl + Shift + Z)"
                >
                  <Redo2
                    size={13}
                  />

                  Redo
                </button>

              </div>

            </>
          )}

        </main>

      </div>

      {/* ==================================================
          NEW PROJECT MODAL
      ================================================== */}

      {showNewProject && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6">

            {/* HEADER */}

            <div className="mb-5 flex items-center justify-between">

              <div>

                <div className="text-lg font-semibold">
                  New Project
                </div>

                <div className="mt-1 text-sm text-neutral-500">
                  สร้างโปรเจกต์ใหม่
                </div>

              </div>

              <button
                onClick={() => {
                  setShowNewProject(
                    false
                  )

                  setNewProjectName(
                    ""
                  )
                }}
                className="text-neutral-500 transition hover:text-white"
                title="Close"
              >

                <X
                  size={20}
                />

              </button>

            </div>

            {/* INPUT */}

            <input
              autoFocus
              value={
                newProjectName
              }
              onChange={(event) =>
                setNewProjectName(
                  event.target
                    .value
                )
              }
              onKeyDown={(
                event
              ) => {

                if (
                  event.key ===
                  "Enter"
                ) {
                  createProject()
                }

                if (
                  event.key ===
                  "Escape"
                ) {
                  setShowNewProject(
                    false
                  )

                  setNewProjectName(
                    ""
                  )
                }

              }}
              placeholder="เช่น VDO 02"
              className="mb-4 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            />

            {/* CREATE BUTTON */}

            <button
              onClick={
                createProject
              }
              className="w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-neutral-200"
            >
              สร้าง Project
            </button>

          </div>

        </div>

      )}

    </div>
  )
}

export default App