// Grade scale mapping
const gradeScale = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  F: 0.0,
}

// Application state
let courses = []
let editingId = null

// DOM elements
const courseForm = document.getElementById("courseForm")
const coursesList = document.getElementById("coursesList")
const semestersList = document.getElementById("semestersList")
const cumulativeGPAEl = document.getElementById("cumulativeGPA")
const totalCreditsEl = document.getElementById("totalCredits")
const totalCoursesEl = document.getElementById("totalCourses")
const gpaProgressEl = document.getElementById("gpaProgress")
const formTitle = document.getElementById("formTitle")
const submitBtn = document.getElementById("submitBtn")
const cancelBtn = document.getElementById("cancelBtn")

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  loadCoursesFromStorage()
  setupEventListeners()
  updateDisplay()
})

// Event listeners
function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", function () {
      const tabId = this.dataset.tab
      switchTab(tabId)
    })
  })

  // Form submission
  courseForm.addEventListener("submit", handleFormSubmit)

  // Cancel edit
  cancelBtn.addEventListener("click", cancelEdit)
}

// Tab switching
function switchTab(tabId) {
  // Update tab buttons
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.remove("active")
  })
  document.querySelector(`[data-tab="${tabId}"]`).classList.add("active")

  // Update tab panels
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.remove("active")
  })
  document.getElementById(tabId).classList.add("active")
}

// Form handling
function handleFormSubmit(e) {
  e.preventDefault()

  const formData = new FormData(courseForm)
  const courseData = {
    id: editingId || Date.now().toString(),
    name: formData.get("courseName") || document.getElementById("courseName").value,
    credits: Number.parseFloat(document.getElementById("credits").value),
    grade: document.getElementById("grade").value,
    gradePoints: gradeScale[document.getElementById("grade").value],
    semester: document.getElementById("semester").value,
  }

  if (editingId) {
    updateCourse(courseData)
  } else {
    addCourse(courseData)
  }

  resetForm()
  updateDisplay()
  saveCoursesToStorage()
}

function addCourse(courseData) {
  courses.push(courseData)
}

function updateCourse(courseData) {
  const index = courses.findIndex((course) => course.id === editingId)
  if (index !== -1) {
    courses[index] = courseData
  }
}

function deleteCourse(id) {
  courses = courses.filter((course) => course.id !== id)
  updateDisplay()
  saveCoursesToStorage()
}

function editCourse(id) {
  const course = courses.find((c) => c.id === id)
  if (course) {
    document.getElementById("courseName").value = course.name
    document.getElementById("credits").value = course.credits
    document.getElementById("grade").value = course.grade
    document.getElementById("semester").value = course.semester

    editingId = id
    formTitle.textContent = "✏️ Edit Course"
    submitBtn.textContent = "Update Course"
    cancelBtn.style.display = "inline-block"

    switchTab("add-course")
  }
}

function cancelEdit() {
  resetForm()
}

function resetForm() {
  courseForm.reset()
  editingId = null
  formTitle.textContent = "➕ Add New Course"
  submitBtn.textContent = "Add Course"
  cancelBtn.style.display = "none"
}

// Display updates
function updateDisplay() {
  updateOverviewCards()
  updateCoursesList()
  updateSemestersList()
}

function updateOverviewCards() {
  const { gpa, totalCredits } = calculateGPA()

  cumulativeGPAEl.textContent = gpa.toFixed(2)
  cumulativeGPAEl.className = `gpa-value ${getGPAClass(gpa)}`

  totalCreditsEl.textContent = totalCredits
  totalCoursesEl.textContent = courses.length

  const progressPercentage = (gpa / 4.0) * 100
  gpaProgressEl.style.width = `${progressPercentage}%`
}

function updateCoursesList() {
  if (courses.length === 0) {
    coursesList.innerHTML = `
            <div class="empty-state">
                <span class="icon">📝</span>
                <p>No courses added yet. Add your first course to get started!</p>
            </div>
        `
    return
  }

  coursesList.innerHTML = courses
    .map(
      (course) => `
        <div class="course-item">
            <div class="course-info">
                <h3>${course.name} <span class="badge badge-secondary">${course.semester}</span></h3>
                <div class="course-details">
                    ${course.credits} credits • Grade: ${course.grade} (${course.gradePoints} points)
                </div>
            </div>
            <div class="course-actions">
                <button class="btn btn-outline" onclick="editCourse('${course.id}')">✏️ Edit</button>
                <button class="btn btn-danger" onclick="deleteCourse('${course.id}')">🗑️ Delete</button>
            </div>
        </div>
    `,
    )
    .join("")
}

function updateSemestersList() {
  const semesters = organizeBySemester()

  if (semesters.length === 0) {
    semestersList.innerHTML = `
            <div class="card">
                <div class="card-content">
                    <div class="empty-state">
                        <span class="icon">📅</span>
                        <p>No semesters found. Add courses to see semester-wise breakdown.</p>
                    </div>
                </div>
            </div>
        `
    return
  }

  semestersList.innerHTML = semesters
    .map(
      (semester) => `
        <div class="card semester-card">
            <div class="card-header">
                <div class="semester-header">
                    <h2>${semester.name}</h2>
                    <div class="semester-stats">
                        <div class="semester-gpa ${getGPAClass(semester.gpa)}">
                            GPA: ${semester.gpa.toFixed(2)}
                        </div>
                        <div class="semester-credits">${semester.totalCredits} credits</div>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(semester.gpa / 4.0) * 100}%"></div>
                </div>
            </div>
            <div class="card-content">
                <div class="semester-courses">
                    ${semester.courses
                      .map(
                        (course) => `
                        <div class="semester-course">
                            <span class="course-name">${course.name}</span>
                            <div class="course-grade">
                                <span>${course.credits} credits</span>
                                <span class="badge ${course.gradePoints >= 3.0 ? "badge-success" : "badge-danger"}">
                                    ${course.grade}
                                </span>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

// Calculations
function calculateGPA() {
  if (courses.length === 0) {
    return { gpa: 0, totalCredits: 0 }
  }

  const totalPoints = courses.reduce((sum, course) => sum + course.gradePoints * course.credits, 0)
  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0)

  return {
    gpa: totalCredits > 0 ? totalPoints / totalCredits : 0,
    totalCredits,
  }
}

function organizeBySemester() {
  const semesterMap = new Map()

  courses.forEach((course) => {
    if (!semesterMap.has(course.semester)) {
      semesterMap.set(course.semester, [])
    }
    semesterMap.get(course.semester).push(course)
  })

  return Array.from(semesterMap.entries())
    .map(([name, courses]) => {
      const totalPoints = courses.reduce((sum, course) => sum + course.gradePoints * course.credits, 0)
      const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0)

      return {
        name,
        courses,
        gpa: totalCredits > 0 ? totalPoints / totalCredits : 0,
        totalCredits,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function getGPAClass(gpa) {
  if (gpa >= 3.7) return "gpa-excellent"
  if (gpa >= 3.0) return "gpa-good"
  if (gpa >= 2.0) return "gpa-average"
  return "gpa-poor"
}

// Local Storage
function saveCoursesToStorage() {
  localStorage.setItem("grade-calculator-courses", JSON.stringify(courses))
}

function loadCoursesFromStorage() {
  const savedCourses = localStorage.getItem("grade-calculator-courses")
  if (savedCourses) {
    courses = JSON.parse(savedCourses)
  }
}

// Make functions globally available for onclick handlers
window.editCourse = editCourse
window.deleteCourse = deleteCourse
