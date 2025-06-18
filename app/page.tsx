"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, BookOpen, Calculator, TrendingUp, Plus, Trash2, Edit3 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Course {
  id: string
  name: string
  credits: number
  grade: string
  gradePoints: number
  semester: string
}

interface Semester {
  name: string
  courses: Course[]
  gpa: number
  totalCredits: number
}

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

export default function GradeCalculator() {
  const [courses, setCourses] = useState<Course[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [currentCourse, setCurrentCourse] = useState({
    name: "",
    credits: "",
    grade: "",
    semester: "",
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [cumulativeGPA, setCumulativeGPA] = useState(0)
  const [totalCredits, setTotalCredits] = useState(0)

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCourses = localStorage.getItem("grade-calculator-courses")
    if (savedCourses) {
      const parsedCourses = JSON.parse(savedCourses)
      setCourses(parsedCourses)
    }
  }, [])

  // Save to localStorage and recalculate whenever courses change
  useEffect(() => {
    localStorage.setItem("grade-calculator-courses", JSON.stringify(courses))
    calculateGPA()
    organizeSemesters()
  }, [courses])

  const calculateGPA = () => {
    if (courses.length === 0) {
      setCumulativeGPA(0)
      setTotalCredits(0)
      return
    }

    const totalPoints = courses.reduce((sum, course) => sum + course.gradePoints * course.credits, 0)
    const totalCreds = courses.reduce((sum, course) => sum + course.credits, 0)

    setCumulativeGPA(totalCreds > 0 ? totalPoints / totalCreds : 0)
    setTotalCredits(totalCreds)
  }

  const organizeSemesters = () => {
    const semesterMap = new Map<string, Course[]>()

    courses.forEach((course) => {
      if (!semesterMap.has(course.semester)) {
        semesterMap.set(course.semester, [])
      }
      semesterMap.get(course.semester)!.push(course)
    })

    const semesterList: Semester[] = Array.from(semesterMap.entries())
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

    setSemesters(semesterList)
  }

  const addOrUpdateCourse = () => {
    if (!currentCourse.name || !currentCourse.credits || !currentCourse.grade || !currentCourse.semester) {
      return
    }

    const gradePoints = gradeScale[currentCourse.grade as keyof typeof gradeScale] || 0
    const credits = Number.parseFloat(currentCourse.credits)

    if (editingId) {
      setCourses(
        courses.map((course) =>
          course.id === editingId
            ? {
                ...course,
                name: currentCourse.name,
                credits,
                grade: currentCourse.grade,
                gradePoints,
                semester: currentCourse.semester,
              }
            : course,
        ),
      )
      setEditingId(null)
    } else {
      const newCourse: Course = {
        id: Date.now().toString(),
        name: currentCourse.name,
        credits,
        grade: currentCourse.grade,
        gradePoints,
        semester: currentCourse.semester,
      }
      setCourses([...courses, newCourse])
    }

    setCurrentCourse({ name: "", credits: "", grade: "", semester: "" })
  }

  const editCourse = (course: Course) => {
    setCurrentCourse({
      name: course.name,
      credits: course.credits.toString(),
      grade: course.grade,
      semester: course.semester,
    })
    setEditingId(course.id)
  }

  const deleteCourse = (id: string) => {
    setCourses(courses.filter((course) => course.id !== id))
  }

  const getGradeColor = (gpa: number) => {
    if (gpa >= 3.7) return "text-green-600"
    if (gpa >= 3.0) return "text-blue-600"
    if (gpa >= 2.0) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressPercentage = (gpa: number) => {
    return (gpa / 4.0) * 100
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            Grade Calculator & Progress Tracker
          </h1>
          <p className="text-gray-600">Track your academic progress and calculate your GPA in real-time</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cumulative GPA</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getGradeColor(cumulativeGPA)}`}>{cumulativeGPA.toFixed(2)}</div>
              <Progress value={getProgressPercentage(cumulativeGPA)} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCredits}</div>
              <p className="text-xs text-muted-foreground">Credit hours completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-muted-foreground">Courses tracked</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="add-course" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add-course">Add Course</TabsTrigger>
            <TabsTrigger value="courses">All Courses</TabsTrigger>
            <TabsTrigger value="semesters">By Semester</TabsTrigger>
          </TabsList>

          {/* Add Course Tab */}
          <TabsContent value="add-course">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {editingId ? "Edit Course" : "Add New Course"}
                </CardTitle>
                <CardDescription>Enter course details to calculate your GPA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-name">Course Name</Label>
                    <Input
                      id="course-name"
                      placeholder="e.g., Calculus I"
                      value={currentCourse.name}
                      onChange={(e) => setCurrentCourse({ ...currentCourse, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="credits">Credit Hours</Label>
                    <Input
                      id="credits"
                      type="number"
                      placeholder="e.g., 3"
                      value={currentCourse.credits}
                      onChange={(e) => setCurrentCourse({ ...currentCourse, credits: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Select
                      value={currentCourse.grade}
                      onValueChange={(value) => setCurrentCourse({ ...currentCourse, grade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(gradeScale).map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade} ({gradeScale[grade as keyof typeof gradeScale]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Input
                      id="semester"
                      placeholder="e.g., Fall 2024"
                      value={currentCourse.semester}
                      onChange={(e) => setCurrentCourse({ ...currentCourse, semester: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={addOrUpdateCourse} className="w-full">
                  {editingId ? "Update Course" : "Add Course"}
                </Button>

                {editingId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(null)
                      setCurrentCourse({ name: "", credits: "", grade: "", semester: "" })
                    }}
                    className="w-full"
                  >
                    Cancel Edit
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>All Courses</CardTitle>
                <CardDescription>Manage all your courses</CardDescription>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No courses added yet. Add your first course to get started!</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{course.name}</h3>
                            <Badge variant="secondary">{course.semester}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {course.credits} credits • Grade: {course.grade} ({course.gradePoints} points)
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => editCourse(course)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteCourse(course.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Semesters Tab */}
          <TabsContent value="semesters">
            <div className="space-y-4">
              {semesters.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No semesters found. Add courses to see semester-wise breakdown.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ) : (
                semesters.map((semester) => (
                  <Card key={semester.name}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{semester.name}</CardTitle>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getGradeColor(semester.gpa)}`}>
                            GPA: {semester.gpa.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">{semester.totalCredits} credits</div>
                        </div>
                      </div>
                      <Progress value={getProgressPercentage(semester.gpa)} className="mt-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {semester.courses.map((course) => (
                          <div key={course.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-medium">{course.name}</span>
                            <div className="flex items-center gap-4 text-sm">
                              <span>{course.credits} credits</span>
                              <Badge variant={course.gradePoints >= 3.0 ? "default" : "destructive"}>
                                {course.grade}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
