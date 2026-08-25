import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Course, CourseLesson } from '../../types/database';
import { GraduationCap, Play, Clock, CheckCircle, BookOpen, Award, Sparkles } from 'lucide-react';

export const CreatorAcademy: React.FC = () => {
  const { courses } = useData();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>(['les-1', 'les-4']);

  const handleOpenCourse = (course: Course) => {
    setSelectedCourse(course);
    setSelectedLesson(course.lessons[0] || null);
  };

  const toggleLessonComplete = (lessonId: string) => {
    if (completedLessons.includes(lessonId)) {
      setCompletedLessons(completedLessons.filter((id) => id !== lessonId));
    } else {
      setCompletedLessons([...completedLessons, lessonId]);
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="purple">Capacitação & Educação</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
          Nail Academy: Do Básico ao Conteúdo Profissional
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Aprenda a produzir fotos nítidas, vídeos magnéticos para Reels/TikTok, dominar técnicas de UGC e negociar parcerias com grandes marcas.
        </p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => {
          const courseLessonIds = course.lessons.map((l) => l.id);
          const completedCount = courseLessonIds.filter((id) => completedLessons.includes(id)).length;
          const progress = Math.round((completedCount / course.lessons.length) * 100) || 0;

          return (
            <Card key={course.id} variant="elevated" className="space-y-4 p-5 flex flex-col justify-between border-border/80 group">
              <div className="space-y-4">
                <div className="relative h-44 rounded-2xl overflow-hidden bg-muted">
                  <img
                    src={course.cover_url}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge variant="gold">{course.category}</Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {course.total_duration_hours}h • {course.lessons.length} aulas
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-base font-display text-foreground leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Progresso do Curso</span>
                    <span className="text-primary font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img
                    src={course.instructor_avatar}
                    alt={course.instructor_name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                    {course.instructor_name}
                  </span>
                </div>
                <Button size="sm" onClick={() => handleOpenCourse(course)}>
                  <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                  Acessar Aulas
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Lesson Player Modal */}
      {selectedCourse && selectedLesson && (
        <Modal
          isOpen={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
          title={selectedCourse.title}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Video Player Placeholder */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-900 flex items-center justify-center border border-border shadow-inner">
              <div className="text-center text-white space-y-2 p-6">
                <div className="w-14 h-14 rounded-full bg-primary/90 text-white flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                  <Play className="w-6 h-6 fill-white ml-1" />
                </div>
                <p className="font-bold text-sm">{selectedLesson.title}</p>
                <p className="text-xs text-white/60">Duração: {selectedLesson.duration_minutes} minutos</p>
              </div>
            </div>

            {/* Lesson Content & Action */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-foreground">{selectedLesson.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedLesson.content}</p>
              </div>

              <Button
                size="sm"
                variant={completedLessons.includes(selectedLesson.id) ? 'outline' : 'primary'}
                onClick={() => toggleLessonComplete(selectedLesson.id)}
              >
                {completedLessons.includes(selectedLesson.id) ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Concluída
                  </span>
                ) : (
                  'Marcar como Concluída'
                )}
              </Button>
            </div>

            {/* Lessons list in course */}
            <div className="space-y-2">
              <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Grade de Aulas ({selectedCourse.lessons.length})
              </h5>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {selectedCourse.lessons.map((lesson, idx) => {
                  const isCurrent = selectedLesson.id === lesson.id;
                  const isDone = completedLessons.includes(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isCurrent ? 'bg-primary/10 font-bold' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                        <div>
                          <p className="text-xs text-foreground">{lesson.title}</p>
                          <p className="text-[10px] text-muted-foreground">{lesson.duration_minutes} min</p>
                        </div>
                      </div>
                      {isDone && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
