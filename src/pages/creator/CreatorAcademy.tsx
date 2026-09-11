import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Course, CourseLesson } from '../../types/database';
import { GraduationCap, Play, Clock, CheckCircle2, BookOpen, Sparkles, Video, Camera, Scissors, DollarSign } from 'lucide-react';

export const CreatorAcademy: React.FC = () => {
  const { courses } = useData();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [interestRegistered, setInterestRegistered] = useState(false);

  // If there are real courses in DB or demo mode
  const hasPublishedCourses = courses && courses.length > 0;

  const plannedModules = [
    {
      id: 'mod-1',
      title: 'Fotografia & Iluminação de Mãos com o Celular',
      category: 'Produção Visual',
      duration: '45 min',
      icon: Camera,
      badge: 'Módulo 1',
      description: 'Como posicionar ring lights sem reflexos indesejados no esmalte, enquadramento das cutículas, limpeza de lente e edição sutil no Lightroom mobile.'
    },
    {
      id: 'mod-2',
      title: 'Roteiros de Alta Retenção no Reels e TikTok',
      category: 'Vídeo & Storytelling',
      duration: '60 min',
      icon: Video,
      badge: 'Módulo 2',
      description: 'Estrutura dos 3 primeiros segundos para prender a atenção, transições ágeis de aplicação e como demonstrar técnicas como fibra de vidro de forma magnética.'
    },
    {
      id: 'mod-3',
      title: 'UGC Profissional: O que as Marcas de Beleza Buscam',
      category: 'Creator Commerce',
      duration: '50 min',
      icon: Scissors,
      badge: 'Módulo 3',
      description: 'Diferença entre publipost genérico e conteúdo gerado pelo usuário (UGC), diretrizes de conformidade CONAR (#publi) e entrega nos formatos solicitados.'
    },
    {
      id: 'mod-4',
      title: 'Precificação, Direitos de Imagem e Finanças para MEI',
      category: 'Negócios & Carreira',
      duration: '40 min',
      icon: DollarSign,
      badge: 'Módulo 4',
      description: 'Como calcular seu valor por entrega, entender cessão de direitos de veiculação em anúncios de marcas e organizar recebimentos via PIX com segurança.'
    }
  ];

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
        <div className="inline-flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider">
          <GraduationCap className="w-4 h-4" />
          <span>Capacitação & Educação</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
          Nail Academy: Do Salão ao Conteúdo Profissional
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Capacitação prática e gratuita feita especialmente para manicures e nail designers que querem transformar sua técnica em conteúdo atrativo e fechar parcerias remuneradas com grandes marcas.
        </p>
      </div>

      {/* Featured Notification Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/5 border border-primary/20 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulos em Produção para o Piloto</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground">
            Aulas Práticas Exclusivas com Especialistas do Mercado
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            As creators selecionadas para o piloto terão acesso prioritário e gratuito aos primeiros módulos em vídeo assim que forem disponibilizados na plataforma.
          </p>
        </div>

        <div>
          {interestRegistered ? (
            <div className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
              <span>Interesse Registrado!</span>
            </div>
          ) : (
            <Button onClick={() => setInterestRegistered(true)} className="shadow-md">
              <GraduationCap className="w-4 h-4 mr-2" />
              Quero Acesso Antecipado
            </Button>
          )}
        </div>
      </div>

      {/* Real Courses if available */}
      {hasPublishedCourses && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-display text-foreground">Cursos Disponíveis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => {
              const courseLessonIds = course.lessons.map((l) => l.id);
              const completedCount = courseLessonIds.filter((id) => completedLessons.includes(id)).length;
              const progress = Math.round((completedCount / (course.lessons.length || 1)) * 100) || 0;

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
                          <Clock className="w-3.5 h-3.5" /> {course.total_duration_hours || 1}h • {course.lessons.length} aulas
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

                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                        <span>Progresso</span>
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
                    <span className="text-xs text-muted-foreground">100% Gratuito</span>
                    <Button size="sm" onClick={() => handleOpenCourse(course)}>
                      <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Acessar Curso
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Planned Modules Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-display text-foreground">Grade Curricular da Academy (Em Produção)</h3>
          <span className="text-xs text-muted-foreground font-medium">4 Módulos Práticos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plannedModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card key={mod.id} variant="elevated" className="p-5 space-y-3 text-left border-border/80">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="purple" size="sm">{mod.badge}</Badge>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-foreground">{mod.title}</h4>
                  <div className="flex items-center space-x-2 text-[11px] text-muted-foreground mt-0.5">
                    <span>{mod.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {mod.duration}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {mod.description}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-border/60 text-[11px] text-primary font-semibold">
                  <span>Disponível em breve</span>
                  <span className="text-muted-foreground">Gratuito para Creators</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Course Player Modal (When real course is clicked) */}
      {selectedCourse && selectedLesson && (
        <Modal isOpen={!!selectedCourse} onClose={() => setSelectedCourse(null)} maxWidth="2xl">
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <Badge variant="gold" size="sm">{selectedCourse.category}</Badge>
                <h3 className="text-lg font-bold text-foreground mt-1">{selectedCourse.title}</h3>
                <p className="text-xs text-muted-foreground">{selectedLesson.title}</p>
              </div>
            </div>

            <div className="aspect-video bg-neutral-900 rounded-2xl flex items-center justify-center text-white p-6 text-center">
              <div className="space-y-2">
                <Play className="w-12 h-12 mx-auto text-primary" />
                <p className="font-bold text-sm">Aula: {selectedLesson.title}</p>
                <p className="text-xs text-neutral-400 max-w-sm">
                  {selectedLesson.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleLessonComplete(selectedLesson.id)}
              >
                {completedLessons.includes(selectedLesson.id) ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" /> Aula Concluída
                  </>
                ) : (
                  <>Marcar como Concluída</>
                )}
              </Button>
              <Button size="sm" onClick={() => setSelectedCourse(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
