import { AgeGroup, CourseSubject } from '../utils/educationLogic';
import {
  Course,
  LessonItem,
  LessonExercise,
} from './curriculumData';

export interface CourseUnitMetadata {
  unitNumber: number;
  title: string;
  subtitle: string;
  levelBadge: string;
}

interface SubjectUnitBlueprint {
  unitTitle: string;
  unitSubtitle: string;
  concepts: {
    topic: string;
    theory: string;
    questionPrompt: string;
    correctAnswer: string;
    distractors: [string, string, string];
    hint: string;
    explanation: string;
  }[];
}

/**
 * Coloca la respuesta correcta exactamente en `targetCorrectIndex` (0, 1, 2 o 3)
 * dentro de la base de datos de preguntas para que la respuesta correcta nunca esté
 * fija en el índice 0 incluso antes de aplicar Fisher-Yates en la interfaz.
 */
function buildOptionsWithCorrectIndex(
  correctAnswer: string,
  distractors: [string, string, string],
  targetCorrectIndex: number
): { options: string[]; correctIndex: number; correctAnswer: string } {
  const idx = ((targetCorrectIndex % 4) + 4) % 4;
  const cleanDistractors = distractors.map((d, i) =>
    d === correctAnswer ? `${d} (opción ${i + 1})` : d
  );
  const options: string[] = [];
  let dPtr = 0;
  for (let pos = 0; pos < 4; pos++) {
    if (pos === idx) {
      options.push(correctAnswer);
    } else {
      options.push(cleanDistractors[dPtr++]);
    }
  }
  return {
    options,
    correctIndex: idx,
    correctAnswer,
  };
}

const UNIT_LEVEL_BADGES: string[] = [
  'Nivel 1 · Principiante',
  'Nivel 2 · Fundamentos',
  'Nivel 3 · Explorador',
  'Nivel 4 · Práctico',
  'Nivel 5 · Intermedio',
  'Nivel 6 · Analítico',
  'Nivel 7 · Avanzado',
  'Nivel 8 · Especialista',
  'Nivel 9 · Estratega',
  'Nivel 10 · Experto / Proyecto Maestro',
];

const CHESS_TACTICAL_PUZZLES = [
  {
    initialFen: '6k1/5p1p/5Qp1/8/8/2B5/5PPP/6K1 w - - 0 1',
    objectiveText: 'Juegan las Blancas: Mueve la Dama de f6 a g7 (Dg7#) para dar Jaque Mate en 1 jugada.',
    targetMoveSan: ['Qg7#'],
    fromSquareHint: 'f6',
    toSquareHint: 'g7',
    explanation: '¡Jaque Mate en 1 jugada (Dg7#)! La Dama y el Alfil cooperan en la gran diagonal.',
  },
  {
    initialFen: '4k3/ppp2ppp/8/4q3/8/5N2/PPP2PPP/3RK3 w - - 0 1',
    objectiveText: 'Juegan las Blancas: Captura la Dama negra indefensa en e5 con tu Caballo de f3 (Cxe5).',
    targetMoveSan: ['Nxe5'],
    fromSquareHint: 'f3',
    toSquareHint: 'e5',
    explanation: '¡Excelente! Capturar piezas indefensas es la forma más segura de ganar ventaja material.',
  },
  {
    initialFen: '4k3/ppp2ppp/8/8/2q1N3/8/PPP2PPP/4K3 w - - 0 1',
    objectiveText: 'Juegan las Blancas: Salta con tu Caballo de e4 a d6 (Cd6+) atacando al Rey y a la Dama.',
    targetMoveSan: ['Nd6+'],
    fromSquareHint: 'e4',
    toSquareHint: 'd6',
    explanation: '¡Tenedor magistral (Cd6+)! El Rey negro está obligado a moverse y ganas la Dama.',
  },
  {
    initialFen: '4k3/ppp2ppp/8/8/4q3/3B4/PPP2PPP/4K2R w K - 0 1',
    objectiveText: '¡Tu Rey está en Jaque! Captura la Dama atacante en e4 con tu Alfil de d3 (Axe4) o sal del jaque.',
    targetMoveSan: ['Bxe4', 'Be2', 'Kf1', 'Kd1'],
    fromSquareHint: 'd3',
    toSquareHint: 'e4',
    explanation: '¡Defensa activa perfecta! Eliminaste la pieza que daba jaque y ganaste material.',
  },
];

const PIANO_MELODY_PATTERNS: {
  title: string;
  notes: string[];
  solfege: string;
}[] = [
  { title: 'Himno a la Alegría (Frase A)', notes: ['E4', 'E4', 'F4', 'G4'], solfege: 'Mi - Mi - Fa - Sol' },
  { title: 'Escala Pentatónica Luminosa', notes: ['C4', 'D4', 'E4', 'G4', 'A4'], solfege: 'Do - Re - Mi - Sol - La' },
  { title: 'Arpegio Mayor de Do', notes: ['C4', 'E4', 'G4', 'C5'], solfege: 'Do - Mi - Sol - Do+' },
  { title: 'Estrellita Musical', notes: ['C4', 'C4', 'G4', 'G4', 'A4', 'G4'], solfege: 'Do - Do - Sol - Sol - La - Sol' },
  { title: 'Cadencia Clásica Sol-Do', notes: ['G4', 'F4', 'E4', 'D4', 'C4'], solfege: 'Sol - Fa - Mi - Re - Do' },
  { title: 'Motivo de Primavera', notes: ['C4', 'E4', 'G4', 'A4', 'G4'], solfege: 'Do - Mi - Sol - La - Sol' },
  { title: 'Salto de Quinta Justa', notes: ['C4', 'G4', 'E4', 'C4'], solfege: 'Do - Sol - Mi - Do' },
  { title: 'Triada Menor Expresiva', notes: ['D4', 'F4', 'A4', 'F4', 'D4'], solfege: 'Re - Fa - La - Fa - Re' },
  { title: 'Fanfarria de Octava', notes: ['C4', 'G4', 'C5', 'G4', 'C5'], solfege: 'Do - Sol - Do+ - Sol - Do+' },
  { title: 'Final Maestro en Do Mayor', notes: ['E4', 'G4', 'C5', 'B4', 'C5'], solfege: 'Mi - Sol - Do+ - Si - Do+' },
];

const DRAWING_STUDIO_GUIDES: {
  prompt: string;
  subtitle: string;
  steps: NonNullable<LessonExercise['drawingSteps']>;
}[] = [
  {
    prompt: 'Taller Paso a Paso: Estructura y Sombreado del Ojo Realista',
    subtitle: 'Sigue las 4 etapas anatómicas y practica el trazo en el lienzo.',
    steps: [
      { stepNumber: 1, title: '1. Eje Horizontal y Almendra', instruction: 'Traza una guía horizontal suave y el círculo del iris.', svgGuideType: 'eye_structure' },
      { stepNumber: 2, title: '2. Párpado, Pupila y Brillo', instruction: 'Reserva un círculo blanco para el reflejo de luz.', svgGuideType: 'eye_structure' },
      { stepNumber: 3, title: '3. Textura Radial del Iris', instruction: 'Sombrea bajo el párpado superior para dar volumen esférico.', svgGuideType: 'sphere_shading' },
      { stepNumber: 4, title: '4. Pestañas en Curva Natural', instruction: 'Traza pestañas curvadas desde el borde exterior.', svgGuideType: 'eye_structure' },
    ],
  },
  {
    prompt: 'Taller Paso a Paso: Esfera 3D, Penumbra y Luz Reflejada',
    subtitle: 'Domina las 5 zonas tonales del claroscuro académico.',
    steps: [
      { stepNumber: 1, title: '1. Contorno Geométrico Limpio', instruction: 'Dibuja un círculo equilibrado con presión suave 2H.', svgGuideType: 'sphere_shading' },
      { stepNumber: 2, title: '2. Línea del Terminador', instruction: 'Divide la zona iluminada de la zona de sombra propia.', svgGuideType: 'sphere_shading' },
      { stepNumber: 3, title: '3. Degradado de Medios Tonos', instruction: 'Usa achurado cruzado suave para conectar luz y sombra.', svgGuideType: 'sphere_shading' },
      { stepNumber: 4, title: '4. Sombra Proyectada y Oclusión', instruction: 'Oscurece la base de apoyo con lápiz 4B respetando la luz reflejada.', svgGuideType: 'perspective_cube' },
    ],
  },
  {
    prompt: 'Taller Paso a Paso: Perspectiva Cónica y Cubo Tridimensional',
    subtitle: 'Proyecta líneas convergentes hacia los puntos de fuga en el horizonte.',
    steps: [
      { stepNumber: 1, title: '1. Línea de Horizonte y Puntos de Fuga', instruction: 'Ubica la altura del observador y los puntos de fuga.', svgGuideType: 'perspective_cube' },
      { stepNumber: 2, title: '2. Arista Vertical Principal', instruction: 'Traza el eje frontal vertical del volumen.', svgGuideType: 'perspective_cube' },
      { stepNumber: 3, title: '3. Líneas de Fuga Laterales', instruction: 'Une los extremos de la arista con los puntos de fuga.', svgGuideType: 'perspective_cube' },
      { stepNumber: 4, title: '4. Valoración Tonal por Planos', instruction: 'Asigna luz al plano superior, medio tono al izquierdo y sombra al derecho.', svgGuideType: 'perspective_cube' },
    ],
  },
  {
    prompt: 'Taller Paso a Paso: Proporciones del Retrato (Canon de Loomis)',
    subtitle: 'Divide el rostro en tres tercios armónicos y sitúa ojos, nariz y boca.',
    steps: [
      { stepNumber: 1, title: '1. Esfera Craneal y Eje de Simetría', instruction: 'Traza el óvalo craneal y la línea vertical central.', svgGuideType: 'portrait_proportions' },
      { stepNumber: 2, title: '2. Regla de los Tres Tercios', instruction: 'Divide desde el nacimiento del cabello a las cejas, nariz y mentón.', svgGuideType: 'portrait_proportions' },
      { stepNumber: 3, title: '3. Alineación Ocular y Comisuras', instruction: 'Separa los ojos por la distancia equivalente a un ojo central.', svgGuideType: 'portrait_proportions' },
      { stepNumber: 4, title: '4. Planos de Luz en Pómulos y Mentón', instruction: 'Sombrea suavemente bajo la nariz, labio inferior y mandíbula.', svgGuideType: 'portrait_proportions' },
    ],
  },
];

function getUnitsCatalogForSubject(
  subject: CourseSubject,
  ageGroup: AgeGroup
): { unitTitle: string; unitSubtitle: string; themeFocus: string }[] {
  switch (subject) {
    case 'reading':
      return [
        { unitTitle: 'Unidad 1: Las Cinco Vocales Mágicas', unitSubtitle: 'Reconocimiento auditivo y visual de A, E, I, O, U', themeFocus: 'vocales iniciales y sonidos claros' },
        { unitTitle: 'Unidad 2: Mis Primeras Sílabas (M, P, S, L)', unitSubtitle: 'Unión de consonantes frecuentes con las vocales', themeFocus: 'sílabas directas ma, me, pa, pe, so, lu' },
        { unitTitle: 'Unidad 3: Palabras de Casa y Familia', unitSubtitle: 'Lectura de palabras bisílabas cotidianas', themeFocus: 'vocabulario familiar como mamá, papá, mesa y casa' },
        { unitTitle: 'Unidad 4: Sílabas con T, D, N y R Suave', unitSubtitle: 'Ampliación fonética con sonidos dentales y vibrantes', themeFocus: 'palabras con nido, pato, dado y luna' },
        { unitTitle: 'Unidad 5: Animales y Naturaleza', unitSubtitle: 'Lectura comprensiva de sustantivos ilustrados', themeFocus: 'nombres de animales del bosque y el mar' },
        { unitTitle: 'Unidad 6: Sonidos C, Q, G y J', unitSubtitle: 'Diferenciación de sonidos suaves y fuertes en español', themeFocus: 'sílabas ca, que, qui, go, gu y ja, je' },
        { unitTitle: 'Unidad 7: Sílabas Trabadas (BR, PL, TR, CL)', unitSubtitle: 'Fluidez en combinaciones de dos consonantes y vocal', themeFocus: 'grupos consonánticos como tren, flor, plato y brisa' },
        { unitTitle: 'Unidad 8: Mis Primeras Oraciones Completas', unitSubtitle: 'Sujeto, verbo y acción en frases alegres', themeFocus: 'oraciones cortas con sentido completo' },
        { unitTitle: 'Unidad 9: Comprensión de Pequeños Cuentos', unitSubtitle: 'Identificación de personajes, lugares y enseñanzas', themeFocus: 'preguntas sobre quién, dónde y qué ocurrió en el cuento' },
        { unitTitle: 'Unidad 10: Proyecto Maestro · Pequeño Gran Lector', unitSubtitle: 'Lectura fluida, entonación con signos y repaso integral', themeFocus: 'lectura expresiva con signos de interrogación y exclamación' },
      ];
    case 'math':
      return [
        { unitTitle: 'Unidad 1: Sentido Numérico y Operaciones Base', unitSubtitle: 'Cálculo ágil, valor posicional y propiedades', themeFocus: 'propiedades conmutativa, asociativa y cálculo exacto' },
        { unitTitle: 'Unidad 2: Fracciones y Proporciones Visuales', unitSubtitle: 'Suma, equivalencia y comparación de fracciones', themeFocus: 'fracciones propias, equivalentes y reparto proporcional' },
        { unitTitle: 'Unidad 3: Decimales y Porcentajes en la Vida Real', unitSubtitle: 'Descuentos, escalas y conversión fracción-decimal', themeFocus: 'cálculo de porcentajes del 10%, 25%, 50% y decimales' },
        { unitTitle: 'Unidad 4: Geometría Plana, Perímetros y Áreas', unitSubtitle: 'Polígonos, triángulos, círculos y diseño espacial', themeFocus: 'fórmulas de área y perímetro en figuras geométricas' },
        { unitTitle: 'Unidad 5: Múltiplos, Divisores y Números Primos', unitSubtitle: 'Criterios de divisibilidad, MCM y MCD', themeFocus: 'factorización prima y mínimo común múltiplo' },
        { unitTitle: 'Unidad 6: Potencias, Raíces y Notación Científica', unitSubtitle: 'Crecimiento exponencial y cuadrados perfectos', themeFocus: 'leyes de los exponentes y raíces cuadradas exactas' },
        { unitTitle: 'Unidad 7: Introducción al Álgebra y Ecuaciones', unitSubtitle: 'Incógnitas, despeje de ecuaciones y balanza lógica', themeFocus: 'resolución paso a paso de ecuaciones de primer grado' },
        { unitTitle: 'Unidad 8: Proporcionalidad, Escalas y Velocidad', unitSubtitle: 'Regla de tres directa, inversa y movimiento uniforme', themeFocus: 'relación distancia = velocidad × tiempo y escalas' },
        { unitTitle: 'Unidad 9: Estadística, Gráficos y Probabilidad', unitSubtitle: 'Media, mediana, moda y cálculo de casos favorables', themeFocus: 'regla de Laplace para probabilidades y análisis de datos' },
        { unitTitle: 'Unidad 10: Proyecto Maestro · Olimpiada Matemática', unitSubtitle: 'Modelado matemático, acertijos combinados y optimización', themeFocus: 'resolución de retos de olimpiada y pensamiento crítico' },
      ];
    case 'finance':
      return [
        { unitTitle: 'Unidad 1: Historia y Funciones del Dinero', unitSubtitle: 'Del trueque a los pagos digitales y el valor del trabajo', themeFocus: 'medio de intercambio, unidad de cuenta y reserva de valor' },
        { unitTitle: 'Unidad 2: Necesidades vs. Deseos y Consumo Consciente', unitSubtitle: 'Priorización inteligente antes de realizar una compra', themeFocus: 'diferencia entre gastos indispensables y compras impulsivas' },
        { unitTitle: 'Unidad 3: El Hábito del Ahorro y las 3 Alcancías', unitSubtitle: 'Metas de corto, mediano y largo plazo', themeFocus: 'regla de dividir ingresos en ahorrar, gastar y compartir' },
        { unitTitle: 'Unidad 4: Presupuesto Personal y Regla 50/30/20', unitSubtitle: 'Registro de ingresos, gastos fijos y gastos variables', themeFocus: 'planificación mensual equilibrada sin déficit' },
        { unitTitle: 'Unidad 5: Bancos, Cuentas y Seguridad Digital', unitSubtitle: 'Cómo funcionan las cuentas de ahorro, tarjetas débito y claves', themeFocus: 'diferencia entre tarjeta de débito y crédito y prevención de fraudes' },
        { unitTitle: 'Unidad 6: Inflación y Poder Adquisitivo', unitSubtitle: 'Por qué suben los precios con el tiempo y cómo proteger el ahorro', themeFocus: 'impacto de la inflación en el valor real del dinero' },
        { unitTitle: 'Unidad 7: El Poder del Interés Simple y Compuesto', unitSubtitle: 'Cómo el tiempo multiplica el capital invertido', themeFocus: 'efecto bola de nieve del interés compuesto anual' },
        { unitTitle: 'Unidad 8: Introducción a la Inversión y Diversificación', unitSubtitle: 'Renta fija, renta variable, riesgo y retorno', themeFocus: 'no poner todos los huevos en la misma canasta (diversificar)' },
        { unitTitle: 'Unidad 9: Impuestos, Economía Familiar y Comunidad', unitSubtitle: 'Cómo se financian los servicios públicos y el bien común', themeFocus: 'cultura tributaria, ética financiera y responsabilidad social' },
        { unitTitle: 'Unidad 10: Proyecto Maestro · Plan Financiero Personal', unitSubtitle: 'Simulación completa de libertad financiera y metas reales', themeFocus: 'construcción de un fondo de emergencia y portafolio a futuro' },
      ];
    case 'drawing':
      return [
        { unitTitle: 'Unidad 1: Control del Trazo, Líneas y Presión del Lápiz', unitSubtitle: 'Graduaciones 2H, HB, 2B y 6B y soltura de muñeca', themeFocus: 'control de presión del grafito y precisión de líneas guía' },
        { unitTitle: 'Unidad 2: Formas Geométricas Base y Encaje', unitSubtitle: 'Simplificación de objetos complejos en esferas, cilindros y cubos', themeFocus: 'encaje estructural mediante formas geométricas simples' },
        { unitTitle: 'Unidad 3: Luz, Sombra y Escala de Valores Tonales', unitSubtitle: 'Luz directa, medio tono, terminador, luz reflejada y sombra proyectada', themeFocus: 'las 5 zonas tonales del claroscuro sobre una esfera 3D' },
        { unitTitle: 'Unidad 4: Técnicas de Sombreado y Texturas Realistas', unitSubtitle: 'Achurado paralelo, achurado cruzado (cross-hatching) y difuminado', themeFocus: 'creación de texturas de madera, metal, cristal y tela' },
        { unitTitle: 'Unidad 5: Perspectiva Lineal de 1, 2 y 3 Puntos de Fuga', unitSubtitle: 'Línea de horizonte, convergencia y profundidad arquitectónica', themeFocus: 'proyección espacial hacia puntos de fuga sobre el horizonte' },
        { unitTitle: 'Unidad 6: Proporción y Bodegón Académico', unitSubtitle: 'Medición visual con el lápiz, espacio negativo y composición', themeFocus: 'relación de tamaños, simetría de elipses y regla de los tercios' },
        { unitTitle: 'Unidad 7: Anatomía del Rostro: Ojos, Nariz y Labios', unitSubtitle: 'Estructura esférica del globo ocular, planos nasales y volumen labial', themeFocus: 'dibujo anatómico realista de facciones humanas paso a paso' },
        { unitTitle: 'Unidad 8: El Retrato Completo y el Método Loomis', unitSubtitle: 'División en tres tercios faciales y vistas en escorzo', themeFocus: 'proporciones clásicas de la cabeza humana en frontal y perfil' },
        { unitTitle: 'Unidad 9: Figura Humana, Gesto y Dinamismo', unitSubtitle: 'Línea de acción, contrapposto y canon de 7.5 a 8 cabezas', themeFocus: 'equilibrio corporal, centro de gravedad y manos expresivas' },
        { unitTitle: 'Unidad 10: Proyecto Maestro · Obra Realista Completa', unitSubtitle: 'Integración de composición, perspectiva atmosférica y claroscuro', themeFocus: 'contraste focal, atmósfera y acabado de galería artística' },
      ];
    case 'entrepreneurship':
      return [
        { unitTitle: 'Unidad 1: Mentalidad Emprendedora y Detección de Problemas', unitSubtitle: 'Empatía, observación activa e innovación con propósito', themeFocus: 'encontrar necesidades reales en la escuela o vecindario' },
        { unitTitle: 'Unidad 2: Propuesta de Valor y Solución Creativa', unitSubtitle: 'Qué hace único a tu producto o servicio frente a las alternativas', themeFocus: 'diseñar beneficios claros que ayuden a las personas' },
        { unitTitle: 'Unidad 3: Costos Fijos, Costos Variables y Precio Justo', unitSubtitle: 'Cálculo de materiales, margen de ganancia y punto de equilibrio', themeFocus: 'fórmula Ganancia = Ingresos Totales menos Costos Totales' },
        { unitTitle: 'Unidad 4: Conociendo al Cliente Ideal y Validación', unitSubtitle: 'Encuestas, escucha activa y mejora continua del producto', themeFocus: 'preguntar y validar antes de fabricar en gran cantidad' },
        { unitTitle: 'Unidad 5: Prototipo Mínimo Viable (MVP)', unitSubtitle: 'Construir una primera versión funcional, rápida y económica', themeFocus: 'aprender rápido con un prototipo sencillo antes de escalar' },
        { unitTitle: 'Unidad 6: Marca, Identidad Visual y Storytelling', unitSubtitle: 'Nombre memorable, logotipo y cómo contar la historia de tu proyecto', themeFocus: 'comunicar confianza, valores y autenticidad de marca' },
        { unitTitle: 'Unidad 7: Canales de Venta y Atención al Cliente', unitSubtitle: 'Experiencia del comprador, postventa y recomendación boca a boca', themeFocus: 'fidelizar clientes mediante calidad y trato excelente' },
        { unitTitle: 'Unidad 8: Métricas Clave (CAC, LTV y Retención)', unitSubtitle: 'Cuánto cuesta conseguir un cliente y cuánto valor aporta en el tiempo', themeFocus: 'sostenibilidad financiera y crecimiento saludable del negocio' },
        { unitTitle: 'Unidad 9: Trabajo en Equipo, Liderazgo y Ética', unitSubtitle: 'Roles complementarios, impacto social y cuidado ambiental', themeFocus: 'emprendimiento de triple impacto: económico, social y ecológico' },
        { unitTitle: 'Unidad 10: Proyecto Maestro · El Gran Pitch de Negocio', unitSubtitle: 'Presentación ejecutiva de 60 segundos ante clientes e inversores', themeFocus: 'estructura de un Elevator Pitch claro, convincente y medible' },
      ];
    case 'piano':
      return [
        { unitTitle: 'Unidad 1: Postura, Teclado y las 7 Notas Naturales', unitSubtitle: 'Ubicación del Do Central (C4) y grupos de 2 y 3 teclas negras', themeFocus: 'identificación visual y auditiva de Do, Re, Mi, Fa, Sol, La, Si' },
        { unitTitle: 'Unidad 2: Ritmo, Pulso y Figuras Musicales', unitSubtitle: 'Redonda (4 tiempos), blanca (2), negra (1) y corcheas (1/2)', themeFocus: 'mantener un tempo constante y contar los tiempos del compás' },
        { unitTitle: 'Unidad 3: Primeras Melodías con Cinco Dedos (Do a Sol)', unitSubtitle: 'Digitación 1-2-3-4-5 de la mano derecha con fraseo legato', themeFocus: 'ejecución fluida de melodías clásicas como el Himno a la Alegría' },
        { unitTitle: 'Unidad 4: Lectura en Pentagrama (Clave de Sol y Fa)', unitSubtitle: 'Líneas (Mi-Sol-Si-Re-Fa) y espacios (Fa-La-Do-Mi) del pentagrama', themeFocus: 'lectura musical a primera vista en ambas claves' },
        { unitTitle: 'Unidad 5: Intervalos Musicales: Segundas, Terceras y Quintas', unitSubtitle: 'Pasos conjuntos, saltos melódicos y consonancia armónica', themeFocus: 'reconocimiento de distancias entre notas en el teclado' },
        { unitTitle: 'Unidad 6: Escalas Mayores y Paso del Pulgar', unitSubtitle: 'Fórmula Tono-Tono-Semitono-Tono-Tono-Tono-Semitono', themeFocus: 'técnica de cruce del pulgar (1-2-3-1-2-3-4-5) en Do y Sol Mayor' },
        { unitTitle: 'Unidad 7: Acordes Triada Mayores y Menores', unitSubtitle: 'Fundamental, tercera y quinta tocadas simultáneamente', themeFocus: 'diferencia sonora entre la alegría del acorde mayor y la nostalgia del menor' },
        { unitTitle: 'Unidad 8: Independencia de Manos y Acompañamiento', unitSubtitle: 'Bajo Alberti y acordes en mano izquierda con melodía en derecha', themeFocus: 'coordinación rítmica entre acompañamiento grave y canto agudo' },
        { unitTitle: 'Unidad 9: Dinámica, Matices (p, mf, f) y Expresión', unitSubtitle: 'Crescendo, diminuendo, staccato, legato y uso del pedal', themeFocus: 'interpretar con emoción y contraste dinámico cada frase musical' },
        { unitTitle: 'Unidad 10: Proyecto Maestro · Recital de Piano Completo', unitSubtitle: 'Progresiones I-IV-V-I, arpegios de octava e interpretación final', themeFocus: 'dominio técnico y expresivo de una pieza completa de concierto' },
      ];
    case 'chess_course':
      return [
        { unitTitle: 'Unidad 1: El Tablero, las Piezas y el Valor Material', unitSubtitle: 'Movimiento de Torre, Alfil, Dama, Rey, Caballo y Peón (1, 3, 3, 5, 9)', themeFocus: 'coordenadas algebraicas y valor relativo de las piezas' },
        { unitTitle: 'Unidad 2: El Jaque, las 3 Defensas y el Jaque Mate en 1', unitSubtitle: 'Capturar, bloquear o mover el Rey (CPR) y patrones de mate directo', themeFocus: 'ejecutar Jaque Mate en 1 jugada y defender al propio Rey' },
        { unitTitle: 'Unidad 3: Captura de Piezas Indefensas y Conteo de Atacantes', unitSubtitle: 'Detectar piezas colgadas y evaluar cambios favorables', themeFocus: 'comparar número de atacantes vs. defensores antes de capturar' },
        { unitTitle: 'Unidad 4: Táctica Fundamental I · El Ataque Doble y Tenedor', unitSubtitle: 'Saltos de Caballo, ataques de Dama y tenedores de peón', themeFocus: 'amenazar dos objetivos valiosos simultáneamente' },
        { unitTitle: 'Unidad 5: Táctica Fundamental II · La Clavada y el Enfilamiento', unitSubtitle: 'Clavada absoluta al Rey, clavada relativa a la Dama y rayos X', themeFocus: 'inmovilizar piezas rivales en filas, columnas y diagonales' },
        { unitTitle: 'Unidad 6: Los 3 Principios de Oro de la Apertura', unitSubtitle: 'Controlar el centro (e4/d4), desarrollar piezas menores y enrocar', themeFocus: 'seguridad del Rey mediante el enroque temprano y desarrollo activo' },
        { unitTitle: 'Unidad 7: Patrones Clásicos de Jaque Mate', unitSubtitle: 'Mate del Pasillo, Mate de Anastasia, Mate de Boden y Mate Ahogado', themeFocus: 'reconocimiento instantáneo de redes de mate sobre el enroque' },
        { unitTitle: 'Unidad 8: Estrategia posicional · Columnas Abiertas y Peón Pasado', unitSubtitle: 'Séptima fila con Torres, casillas débiles y estructura de peones', themeFocus: 'crear y apoyar un peón pasado rumbo a la coronación' },
        { unitTitle: 'Unidad 9: Finales Esenciales de Rey, Peones y Torres', unitSubtitle: 'La Oposición del Rey, regla del cuadrado y puente de Lucena', themeFocus: 'técnica precisa para convertir ventaja en el final de partida' },
        { unitTitle: 'Unidad 10: Proyecto Maestro · Cálculo de Gran Maestro', unitSubtitle: 'Combinaciones de sacrificio, jugadas forzadas (Jaques, Capturas, Amenazas)', themeFocus: 'método de cálculo candidato para dominar partidas con reloj' },
      ];
    case 'english':
      return [
        { unitTitle: 'Unidad 1: Greetings, Introductions & Personal Pronouns', unitSubtitle: 'Verb To Be (am, is, are), numbers, ages, and polite expressions', themeFocus: 'presentarse en inglés y usar correctamente I am, You are, He/She is' },
        { unitTitle: 'Unidad 2: Daily Routines, Family & Present Simple', unitSubtitle: 'Affirmative, negative (don’t / doesn’t), and third-person -s rule', themeFocus: 'describir hábitos diarios con adverbios de frecuencia (always, usually)' },
        { unitTitle: 'Unidad 3: Action in Progress · Present Continuous', unitSubtitle: 'Verb + -ing for actions happening right now vs. habitual actions', themeFocus: 'diferenciar "I play chess every day" de "I am playing chess right now"' },
        { unitTitle: 'Unidad 4: Past Adventures · Past Simple (Regular & Irregular)', unitSubtitle: 'Did / didn’t, -ed endings, and core irregular verbs (went, saw, made)', themeFocus: 'narrar historias y experiencias pasadas con precisión gramatical' },
        { unitTitle: 'Unidad 5: Comparisons, Superlatives & Describing the World', unitSubtitle: 'Taller than, more interesting than, the fastest, and adjectives', themeFocus: 'comparar objetos, ciudades y récords usando adjetivos cortos y largos' },
        { unitTitle: 'Unidad 6: Future Plans & Predictions (Will vs. Going To)', unitSubtitle: 'Spontaneous decisions, promises, and planned intentions', themeFocus: 'expresar metas futuras y predicciones científicas en inglés' },
        { unitTitle: 'Unidad 7: Life Experiences · Present Perfect (Have / Has + Participle)', unitSubtitle: 'Ever, never, already, yet, for, and since in real conversations', themeFocus: 'conectar acciones del pasado con el presente usando Present Perfect' },
        { unitTitle: 'Unidad 8: Modal Verbs of Ability, Advice & Obligation', unitSubtitle: 'Can, could, should, must, and have to in school and travel contexts', themeFocus: 'dar consejos saludables y expresar reglas o habilidades en inglés' },
        { unitTitle: 'Unidad 9: Conditionals (Zero, First & Second) & Phrasal Verbs', unitSubtitle: 'Cause and effect, hypothetical scenarios, and natural idioms', themeFocus: 'estructuras "If + Present, Will" e "If + Past, Would" en contexto' },
        { unitTitle: 'Unidad 10: Proyecto Maestro · Academic Reading & Global Fluency', unitSubtitle: 'Passive voice, reported speech, connectors, and critical comprehension', themeFocus: 'comprensión lectora avanzada y argumentación fluida en inglés' },
      ];
    case 'orthography':
      return [
        { unitTitle: 'Unidad 1: Las Reglas de Oro de la B y la V', unitSubtitle: 'Terminaciones -aba, grupos bl/br, prefijos bi-/sub- y adjetivos en -ivo', themeFocus: 'dominio ortográfico de palabras con B y V sin dudar' },
        { unitTitle: 'Unidad 2: El Secreto de la H Muda e Intercalada', unitSubtitle: 'Diptongos hia-, hie-, hue-, hui- y verbos haber, hacer, hablar, habitar', themeFocus: 'distinguir "haber / a ver" y "hecho / echo" en contexto' },
        { unitTitle: 'Unidad 3: Sonidos de C, S y Z y Plurales', unitSubtitle: 'Cambio de Z a C ante E/I (pez -> peces), sufijos -ción, -sión y -azo', themeFocus: 'escritura impecable de sufijos y plurales derivados de Z' },
        { unitTitle: 'Unidad 4: Precisión con la G, la J y la Diéresis (Ü)', unitSubtitle: 'Sonidos suaves (ga, gue, gui, go, gu), diéresis (pingüino) y terminación -aje', themeFocus: 'reglas de verbos en -ger/-gir y sustantivos terminados en -aje/-eje' },
        { unitTitle: 'Unidad 5: La Sílaba Tónica y Palabras Agudas', unitSubtitle: 'Identificación del golpe de voz y tilde en agudas terminadas en N, S o Vocal', themeFocus: 'acentuación correcta de palabras agudas como canción, compás y colibrí' },
        { unitTitle: 'Unidad 6: Palabras Graves (Llanas), Esdrújulas y Sobresdrújulas', unitSubtitle: 'Reglas generales de acentuación gráfica en español', themeFocus: 'por qué "árbol" y "lápiz" llevan tilde y todas las esdrújulas se tildan' },
        { unitTitle: 'Unidad 7: Diptongos, Triptongos e Hiatos Acentuales', unitSubtitle: 'Vocales abiertas (a, e, o) y cerradas (i, u) y tilde de ruptura (baúl, río)', themeFocus: 'identificar cuándo dos vocales forman una sola sílaba o se separan en hiato' },
        { unitTitle: 'Unidad 8: La Tilde Diacrítica en Monosílabos e Interrogativos', unitSubtitle: 'Tú/tu, él/el, mí/mi, sí/si, té/te, sé/se, más/mas y qué/cómo/dónde', themeFocus: 'diferenciar significado gramatical mediante la tilde diacrítica' },
        { unitTitle: 'Unidad 9: Signos de Puntuación, Coma Vocativa y Dos Puntos', unitSubtitle: 'Coma enumerativa, vocativa, punto y seguido, comillas y signos dobles (¿? ¡!)', themeFocus: 'claridad y ritmo en la redacción mediante puntuación precisa' },
        { unitTitle: 'Unidad 10: Proyecto Maestro · Redacción y Estilo Impecable', unitSubtitle: 'Parónimos (ahí/hay/¡ay!, porque/por qué/porqué), conectores y edición', themeFocus: 'revisión integral de textos académicos y literarios' },
      ];
    case 'prayer':
      return [
        { unitTitle: 'Unidad 1: Hablar con Dios desde el Corazón y la Señal de la Cruz', unitSubtitle: 'El sentido de la oración diaria, la gratitud y la paz interior', themeFocus: 'comenzar el día en el nombre del Padre, del Hijo y del Espíritu Santo' },
        { unitTitle: 'Unidad 2: El Padre Nuestro Paso a Paso', unitSubtitle: 'Las 7 peticiones de la oración que Jesús nos enseñó en el Evangelio', themeFocus: 'comprender el pan de cada día y el perdón fraterno' },
        { unitTitle: 'Unidad 3: El Ave María y la Confianza Maternal', unitSubtitle: 'El saludo del ángel Gabriel y de Santa Isabel en el Evangelio de San Lucas', themeFocus: 'meditar cada frase del Ave María con serenidad' },
        { unitTitle: 'Unidad 4: El Gloria, el Credo y el Ángel de la Guarda', unitSubtitle: 'Alabanza a la Santísima Trinidad y profesión de fe cristiana', themeFocus: 'estructura trinitaria del Gloria y protección espiritual' },
        { unitTitle: 'Unidad 5: Cómo Rezar el Santo Rosario Cuenta por Cuenta', unitSubtitle: 'Cruz inicial, Padre Nuestro, las 10 Avemarías de cada decena y el Gloria', themeFocus: 'recorrido práctico de las 5 decenas del Santo Rosario' },
        { unitTitle: 'Unidad 6: Los Cinco Misterios Gozosos (Lunes y Sábado)', unitSubtitle: 'Anunciación, Visitación, Nacimiento de Jesús, Presentación y Hallazgo en el Templo', themeFocus: 'la alegría de la Encarnación y la infancia de Jesús en Nazaret' },
        { unitTitle: 'Unidad 7: Los Cinco Misterios Luminosos (Jueves)', unitSubtitle: 'Bautismo en el Jordán, Bodas de Caná, Anuncio del Reino, Transfiguración y Eucaristía', themeFocus: 'la vida pública de Cristo como Luz del mundo' },
        { unitTitle: 'Unidad 8: Los Cinco Misterios Dolorosos (Martes y Viernes)', unitSubtitle: 'Oración en el Huerto, Flagelación, Coronación, Cruz a cuestas y Crucifixión', themeFocus: 'el amor redentor, la fortaleza en la prueba y la compasión' },
        { unitTitle: 'Unidad 9: Los Cinco Misterios Gloriosos (Miércoles y Domingo)', unitSubtitle: 'Resurrección, Ascensión, Pentecostés, Asunción y Coronación de María', themeFocus: 'la esperanza cristiana, los dones del Espíritu Santo y la vida nueva' },
        { unitTitle: 'Unidad 10: Proyecto Maestro · Virtudes, Gratitud y Servicio al Prójimo', unitSubtitle: 'Fe, Esperanza, Caridad, Prudencia, Justicia, Fortaleza y Templanza', themeFocus: 'vivir los frutos de la oración ayudando con alegría a la familia y amigos' },
      ];
  }
}

/**
 * Construye los 3 ejercicios progresivos y únicos para cada una de las 100 lecciones
 * de un curso, asegurando que:
 * - El contenido sea específico del tema de la unidad y del número de lección (1..100).
 * - `correctIndex` varíe sistemáticamente entre `0`, `1`, `2` y `3` en la base de datos.
 * - Los cursos interactivos (Ajedrez, Piano, Dibujo) combinen práctica interactiva real
 *   con ejercicios conceptuales de opción múltiple.
 */
function generateExercisesForLesson(params: {
  subject: CourseSubject;
  ageGroup: AgeGroup;
  unitNumber: number;
  lessonInUnit: number;
  globalLevelNumber: number;
  unitTitle: string;
  themeFocus: string;
}): LessonExercise[] {
  const {
    subject,
    ageGroup,
    unitNumber,
    lessonInUnit,
    globalLevelNumber,
    unitTitle,
    themeFocus,
  } = params;

  const baseId = `ex-${subject}-${ageGroup}-u${unitNumber}-l${lessonInUnit}`;
  const idx0 = (globalLevelNumber + 0) % 4;
  const idx1 = (globalLevelNumber + 1) % 4;
  const idx2 = (globalLevelNumber + 2) % 4;

  if (subject === 'math') {
    const a = unitNumber * 3 + lessonInUnit;
    const b = unitNumber + lessonInUnit + 2;
    const sum = a + b;
    const prod = a * b;
    const perimeter = 2 * (a + b);

    const q1 = buildOptionsWithCorrectIndex(
      `${prod}`,
      [`${prod + a}`, `${prod - b}`, `${sum}`],
      idx0
    );
    const q2 = buildOptionsWithCorrectIndex(
      `${perimeter} unidades de perímetro`,
      [
        `${prod} unidades de perímetro`,
        `${a + b} unidades de perímetro`,
        `${perimeter + 6} unidades de perímetro`,
      ],
      idx1
    );
    const xVal = lessonInUnit + unitNumber;
    const coeff = (unitNumber % 4) + 2;
    const rhs = coeff * xVal + b;
    const q3 = buildOptionsWithCorrectIndex(
      `x = ${xVal}`,
      [`x = ${xVal + 2}`, `x = ${xVal - 1}`, `x = ${coeff + b}`],
      idx2
    );

    return [
      {
        id: `${baseId}-1`,
        type: 'multiple_choice',
        prompt: `[${unitTitle}] Si organizas ${a} filas con ${b} elementos cada una en el reto #${globalLevelNumber}, ¿cuántos elementos hay en total?`,
        subtitle: `Aplica ${themeFocus} para calcular el producto exacto.`,
        options: q1.options,
        correctAnswer: q1.correctAnswer,
        correctIndex: q1.correctIndex,
        hint: `Multiplica ${a} × ${b}.`,
        explanation: `Al multiplicar ${a} filas por ${b} elementos obtenemos ${a} × ${b} = ${prod}.`,
      },
      {
        id: `${baseId}-2`,
        type: 'multiple_choice',
        prompt: `Un terreno rectangular de estudio mide ${a} m de largo y ${b} m de ancho. ¿Cuál es su perímetro total?`,
        subtitle: 'Recuerda que el perímetro es la suma de los 4 lados del rectángulo.',
        options: q2.options,
        correctAnswer: q2.correctAnswer,
        correctIndex: q2.correctIndex,
        hint: `Suma largo + ancho (${a} + ${b} = ${sum}) y multiplícalo por 2.`,
        explanation: `Perímetro = 2 × (${a} + ${b}) = 2 × ${sum} = ${perimeter} unidades.`,
      },
      {
        id: `${baseId}-3`,
        type: 'multiple_choice',
        prompt: `Desafío de razonamiento (Nivel ${globalLevelNumber}): Si ${coeff}x + ${b} = ${rhs}, ¿cuál es el valor exacto de la incógnita x?`,
        options: q3.options,
        correctAnswer: q3.correctAnswer,
        correctIndex: q3.correctIndex,
        hint: `Resta ${b} a ${rhs} (${rhs - b}) y divide el resultado entre ${coeff}.`,
        explanation: `${coeff}x = ${rhs} - ${b} = ${coeff * xVal}, por lo tanto x = ${coeff * xVal} / ${coeff} = ${xVal}.`,
      },
    ];
  }

  if (subject === 'finance') {
    const weeklyIncome = (unitNumber + 2) * 10 + lessonInUnit * 2;
    const saveRate = 20 + (lessonInUnit % 4) * 5;
    const savedAmount = Math.round((weeklyIncome * saveRate) / 100);
    const goalWeeks = (lessonInUnit % 5) + 4;
    const totalSaved = savedAmount * goalWeeks;

    const q1 = buildOptionsWithCorrectIndex(
      `$${savedAmount} ahorrados por semana (${saveRate}%)`,
      [
        `$${ Math.max(1, savedAmount - 5) } ahorrados por semana`,
        `$${savedAmount + 12} ahorrados por semana`,
        `$${weeklyIncome} gastados sin ahorrar`,
      ],
      idx0
    );
    const q2 = buildOptionsWithCorrectIndex(
      `Reúnes $${totalSaved} en ${goalWeeks} semanas`,
      [
        `Reúnes $${totalSaved + savedAmount * 2} en ${goalWeeks} semanas`,
        `Reúnes $${savedAmount} en total`,
        `Reúnes $${ Math.max(2, totalSaved - 15) } en ${goalWeeks} semanas`,
      ],
      idx1
    );
    const q3 = buildOptionsWithCorrectIndex(
      `Porque aplica ${themeFocus}, protegiendo tus metas futuras antes de los gastos impulsivos`,
      [
        'Porque gastar todo el dinero el primer día evita llevar cuentas',
        'Porque las compras impulsivas multiplican el ahorro automáticamente',
        'Porque endeudarse sin presupuesto reduce los costos fijos',
      ],
      idx2
    );

    return [
      {
        id: `${baseId}-1`,
        type: 'multiple_choice',
        prompt: `[${unitTitle}] Recibes $${weeklyIncome} esta semana y decides separar el ${saveRate}% para tu meta de ahorro. ¿Cuánto guardas en tu alcancía?`,
        options: q1.options,
        correctAnswer: q1.correctAnswer,
        correctIndex: q1.correctIndex,
        hint: `Calcula el ${saveRate}% de $${weeklyIncome}: (${weeklyIncome} × ${saveRate}) / 100.`,
        explanation: `El ${saveRate}% de $${weeklyIncome} equivale exactamente a $${savedAmount} destinados a tu futuro.`,
      },
      {
        id: `${baseId}-2`,
        type: 'multiple_choice',
        prompt: `Si mantienes tu constancia ahorrando $${savedAmount} cada semana durante ${goalWeeks} semanas seguidas, ¿cuánto capital habrás acumulado?`,
        options: q2.options,
        correctAnswer: q2.correctAnswer,
        correctIndex: q2.correctIndex,
        hint: `Multiplica tu ahorro semanal ($${savedAmount}) por las ${goalWeeks} semanas.`,
        explanation: `$${savedAmount} × ${goalWeeks} semanas = $${totalSaved} acumulados gracias a tu disciplina financiera.`,
      },
      {
        id: `${baseId}-3`,
        type: 'multiple_choice',
        prompt: `Principio Financiero (Lección ${globalLevelNumber}): ¿Por qué es clave dominar ${themeFocus}?`,
        options: q3.options,
        correctAnswer: q3.correctAnswer,
        correctIndex: q3.correctIndex,
        hint: 'Piensa en la diferencia entre planificar con metas claras y gastar por impulso.',
        explanation: `La educación financiera se basa en ${themeFocus} para tomar decisiones libres e inteligentes.`,
      },
    ];
  }

  if (subject === 'entrepreneurship') {
    const unitCost = unitNumber + (lessonInUnit % 5) + 2;
    const unitPrice = unitCost + unitNumber + 3;
    const marginPerUnit = unitPrice - unitCost;
    const unitsSold = (lessonInUnit + 2) * 5;
    const totalProfit = marginPerUnit * unitsSold;

    const q1 = buildOptionsWithCorrectIndex(
      `$${marginPerUnit} de margen de ganancia por unidad`,
      [
        `$${unitPrice} de ganancia neta sin descontar costos`,
        `$${unitCost} de ganancia por unidad`,
        `$${unitPrice + unitCost} de margen por unidad`,
      ],
      idx0
    );
    const q2 = buildOptionsWithCorrectIndex(
      `$${totalProfit} de utilidad neta total`,
      [
        `$${totalProfit + 25} de utilidad neta`,
        `$${unitPrice * unitsSold} de utilidad sin restar materiales`,
        `$${Math.max(5, totalProfit - 15)} de utilidad neta`,
      ],
      idx1
    );
    const q3 = buildOptionsWithCorrectIndex(
      `Enfocarse en ${themeFocus} escuchando a los usuarios reales para mejorar el proyecto`,
      [
        'Ignorar la opinión de los clientes y nunca medir los costos',
        'Fabricar miles de unidades sin haber probado antes el prototipo',
        'Subir el precio sin ofrecer valor ni resolver ningún problema',
      ],
      idx2
    );

    return [
      {
        id: `${baseId}-1`,
        type: 'multiple_choice',
        prompt: `[${unitTitle}] En tu proyecto emprendedor #${globalLevelNumber}, crear cada producto cuesta $${unitCost} en materiales y lo vendes a $${unitPrice}. ¿Cuál es tu margen de ganancia unitario?`,
        options: q1.options,
        correctAnswer: q1.correctAnswer,
        correctIndex: q1.correctIndex,
        hint: `Resta el Precio de venta ($${unitPrice}) menos el Costo unitario ($${unitCost}).`,
        explanation: `Margen unitario = $${unitPrice} - $${unitCost} = $${marginPerUnit} por cada unidad entregada.`,
      },
      {
        id: `${baseId}-2`,
        type: 'multiple_choice',
        prompt: `Si este mes tu equipo logra vender ${unitsSold} unidades con una ganancia neta de $${marginPerUnit} por unidad, ¿cuál es la utilidad total?`,
        options: q2.options,
        correctAnswer: q2.correctAnswer,
        correctIndex: q2.correctIndex,
        hint: `Multiplica ${unitsSold} unidades por $${marginPerUnit} de ganancia unitaria.`,
        explanation: `${unitsSold} unidades × $${marginPerUnit} = $${totalProfit} de utilidad para reinvertir y crecer.`,
      },
      {
        id: `${baseId}-3`,
        type: 'multiple_choice',
        prompt: `Estrategia de Emprendimiento (Nivel ${globalLevelNumber}): ¿Cuál es la mejor decisión al aplicar ${themeFocus}?`,
        options: q3.options,
        correctAnswer: q3.correctAnswer,
        correctIndex: q3.correctIndex,
        hint: 'Todo gran emprendimiento nace de resolver un problema real con empatía y métricas claras.',
        explanation: `Al aplicar ${themeFocus}, validas tu propuesta de valor y construyes un proyecto sostenible.`,
      },
    ];
  }

  if (subject === 'chess_course') {
    const puzzle = CHESS_TACTICAL_PUZZLES[(globalLevelNumber - 1) % CHESS_TACTICAL_PUZZLES.length];
    const q2 = buildOptionsWithCorrectIndex(
      `Aplicar ${themeFocus} verificando primero jaques, capturas y amenazas del rival`,
      [
        'Mover cualquier peón lateral sin mirar las amenazas del oponente',
        'Sacrificar la Dama sin compensación ni cálculo previo',
        'Dejar al Rey en el centro sin enrocar durante toda la partida',
      ],
      idx1
    );
    const q3 = buildOptionsWithCorrectIndex(
      '9 puntos la Dama, 5 la Torre, 3 el Alfil o Caballo y 1 el Peón',
      [
        '1 punto la Dama, 9 el Peón y 2 la Torre',
        'Todas las piezas valen exactamente 5 puntos sin excepción',
        'El Caballo vale 10 puntos y la Torre vale 1 punto',
      ],
      idx2
    );

    return [
      {
        id: `${baseId}-1`,
        type: 'chess_puzzle',
        prompt: `[${unitTitle} · Lección ${globalLevelNumber}] ${puzzle.objectiveText}`,
        subtitle: 'Arrastra la pieza en el tablero real o haz clic en la casilla de origen y destino.',
        hint: `Observa la casilla ${puzzle.fromSquareHint} y lleva tu pieza hacia ${puzzle.toSquareHint}.`,
        chessPuzzle: puzzle,
      },
      {
        id: `${baseId}-2`,
        type: 'multiple_choice',
        prompt: `Criterio Táctico (Nivel ${globalLevelNumber}): En esta fase del estudio sobre ${themeFocus}, ¿qué hábito distingue a un buen ajedrecista?`,
        options: q2.options,
        correctAnswer: q2.correctAnswer,
        correctIndex: q2.correctIndex,
        hint: 'En ajedrez siempre revisamos las jugadas forzadas (jaques, capturas y amenazas) antes de tocar una pieza.',
        explanation: `Dominar ${themeFocus} exige calcular las respuestas activas del rival antes de realizar la jugada.`,
      },
      {
        id: `${baseId}-3`,
        type: 'multiple_choice',
        prompt: `Evaluación de Material (Lección ${globalLevelNumber}): ¿Cuál es la escala clásica de valor de las piezas para decidir si un cambio es favorable?`,
        options: q3.options,
        correctAnswer: q3.correctAnswer,
        correctIndex: q3.correctIndex,
        hint: 'La Dama es la pieza más potente en valor numérico (9) y el Peón es la unidad base (1).',
        explanation: 'Conocer el valor relativo (Dama=9, Torre=5, Alfil/Caballo=3, Peón=1) evita entregar material de más.',
      },
    ];
  }

  if (subject === 'piano') {
    const melody = PIANO_MELODY_PATTERNS[(globalLevelNumber - 1) % PIANO_MELODY_PATTERNS.length];
    const q2 = buildOptionsWithCorrectIndex(
      `Secuencia ${melody.solfege} (${melody.notes.join(' - ')})`,
      [
        'Tocar únicamente teclas al azar sin respetar el pulso rítmico',
        'Presionar todas las teclas negras con un solo dedo rígido',
        'Detenerse en cada compás sin escuchar la altura de las notas',
      ],
      idx1
    );
    const q3 = buildOptionsWithCorrectIndex(
      `Permite desarrollar ${themeFocus} con postura relajada y oído musical preciso`,
      [
        'Obliga a tensar los hombros y golpear fuerte el teclado',
        'Elimina la necesidad de leer las notas o llevar el compás',
        'Hace que todas las canciones suenen sin ritmo ni matices',
      ],
      idx2
    );

    return [
      {
        id: `${baseId}-1`,
        type: 'piano_melody',
        prompt: `[${unitTitle} · Nivel ${globalLevelNumber}] Interpreta en el teclado: "${melody.title}" (${melody.solfege})`,
        subtitle: 'Pulsa las teclas iluminadas en orden para escuchar la afinación real de cada nota.',
        targetNotes: melody.notes,
        hint: `Toca paso a paso las teclas: ${melody.notes.join(' → ')} (${melody.solfege}).`,
      },
      {
        id: `${baseId}-2`,
        type: 'multiple_choice',
        prompt: `Teoría Musical (Lección ${globalLevelNumber}): ¿Qué patrón melódico acabas de interpretar en el teclado interactivo?`,
        options: q2.options,
        correctAnswer: q2.correctAnswer,
        correctIndex: q2.correctIndex,
        hint: `Observa las notas de "${melody.title}": ${melody.solfege}.`,
        explanation: `La frase "${melody.title}" se construye con las notas ${melody.solfege} (${melody.notes.join(', ')}).`,
      },
      {
        id: `${baseId}-3`,
        type: 'multiple_choice',
        prompt: `Técnica Pianística (Unidad ${unitNumber}): ¿Por qué practicamos ${themeFocus}?`,
        options: q3.options,
        correctAnswer: q3.correctAnswer,
        correctIndex: q3.correctIndex,
        hint: 'La buena técnica en el piano une relajación muscular, ritmo constante y escucha atenta.',
        explanation: `Al trabajar ${themeFocus}, logras fluidez en los dedos y expresividad musical real.`,
      },
    ];
  }

  if (subject === 'drawing') {
    const guide = DRAWING_STUDIO_GUIDES[(globalLevelNumber - 1) % DRAWING_STUDIO_GUIDES.length];
    const q2 = buildOptionsWithCorrectIndex(
      `Aplicar ${themeFocus} empezando con trazos suaves de encaje antes de sombrear los detalles`,
      [
        'Presionar el lápiz 6B al máximo desde el primer segundo sin medir proporciones',
        'Dibujar detalles aislados sin construir primero la estructura general',
        'Borrar la hoja con fuerza en lugar de observar la dirección de la luz',
      ],
      idx1
    );
    const q3 = buildOptionsWithCorrectIndex(
      'Luz directa, medio tono, línea del terminador, sombra propia con luz reflejada y sombra proyectada',
      [
        'Un único tono plano sin diferencias entre la luz y la sombra',
        'Contorno grueso exterior sin volumen interior ni perspectiva',
        'Sombra proyectada colocada del mismo lado que el foco de luz',
      ],
      idx2
    );

    return [
      {
        id: `${baseId}-1`,
        type: 'drawing_studio',
        prompt: `[${unitTitle} · Nivel ${globalLevelNumber}] ${guide.prompt}`,
        subtitle: `${guide.subtitle} Enfoque de hoy: ${themeFocus}.`,
        hint: 'Recorre los 4 pasos de la guía anatómica/espacial y practica en tu lienzo.',
        drawingSteps: guide.steps,
      },
      {
        id: `${baseId}-2`,
        type: 'multiple_choice',
        prompt: `Fundamento de Dibujo Realista (Lección ${globalLevelNumber}): ¿Cuál es el procedimiento correcto al trabajar ${themeFocus}?`,
        options: q2.options,
        correctAnswer: q2.correctAnswer,
        correctIndex: q2.correctIndex,
        hint: 'En el dibujo académico siempre vamos de lo general (proporción y encaje suave) a lo particular (valores tonales y textura).',
        explanation: `Dominar ${themeFocus} requiere construir primero las proporciones con lápiz suave (2H/HB) antes de dar volumen.`,
      },
      {
        id: `${baseId}-3`,
        type: 'multiple_choice',
        prompt: `Claroscuro y Volumen (Unidad ${unitNumber}): ¿Cuáles son los elementos que crean ilusión tridimensional realista en el papel?`,
        options: q3.options,
        correctAnswer: q3.correctAnswer,
        correctIndex: q3.correctIndex,
        hint: 'Recuerda cómo incide la luz sobre una esfera y cómo rebota suavemente en la base (luz reflejada).',
        explanation: 'La transición gradual entre luz directa, medio tono, terminador, luz reflejada y sombra proyectada genera volumen 3D.',
      },
    ];
  }

  if (subject === 'english') {
    const englishPairs = [
      {
        q: 'How do you introduce yourself and state your age accurately in English?',
        ok: 'Hello! My name is Alex and I am twelve years old.',
        bad: ['Hello! My name are Alex and I have twelve years.', 'Good bye! I am twelve years yesterday.', 'Me name Alex, tener twelve.'],
        rule: 'En inglés usamos "am / is / are" (verbo to be) para decir la edad, nunca "have".',
      },
      {
        q: 'Choose the grammatically correct sentence in Present Simple (third person singular):',
        ok: 'She studies English and plays chess every afternoon.',
        bad: ['She study English and play chess every afternoon.', 'She studying English every afternoon.', 'Does she studies English every day?'],
        rule: 'En tercera persona del singular (he, she, it) en afirmación agregamos -s / -ies al verbo.',
      },
      {
        q: 'Complete the Past Simple question: "Where ___ they travel last summer?"',
        ok: 'did (Where did they travel last summer?)',
        bad: ['do (Where do they traveled?)', 'were (Where were they travel?)', 'has (Where has they travel?)'],
        rule: 'Para preguntas en Past Simple usamos el auxiliar "did" seguido del verbo en su forma base.',
      },
      {
        q: 'Select the correct Comparative & Superlative form in English:',
        ok: 'This book is more interesting than that one, and it is the best in the library.',
        bad: ['This book is more interestinger that the library.', 'This book is most gooder than that one.', 'This book is the more faster of all.'],
        rule: 'Los adjetivos largos usan "more ... than" y el superlativo irregular de "good" es "the best".',
      },
      {
        q: 'Choose the correct First Conditional sentence about future consequences:',
        ok: 'If you practice every day, you will improve your English fluency rapidly.',
        bad: ['If you will practice every day, you improve.', 'If you practiced every day, you will improved.', 'When you practice, you would improved yesterday.'],
        rule: 'El First Conditional combina "If + Present Simple" con "will + infinitivo" para resultados probables.',
      },
    ];

    const pairA = englishPairs[(globalLevelNumber - 1) % englishPairs.length];
    const pairB = englishPairs[globalLevelNumber % englishPairs.length];

    const q1 = buildOptionsWithCorrectIndex(pairA.ok, pairA.bad as [string, string, string], idx0);
    const q2 = buildOptionsWithCorrectIndex(pairB.ok, pairB.bad as [string, string, string], idx1);
    const q3 = buildOptionsWithCorrectIndex(
      `Applies ${themeFocus} in real communicative context`,
      [
        'Translates word by word ignoring English verb tenses',
        'Omits the subject pronoun in every English clause',
        'Uses past participles without auxiliary verbs in questions',
      ],
      idx2
    );

    return [
      {
        id: `${baseId}-1`,
        type: 'multiple_choice',
        prompt: `[${unitTitle} · Lesson ${globalLevelNumber}] ${pairA.q}`,
        subtitle: `Focus: ${themeFocus}.`,
        options: q1.options,
        correctAnswer: q1.correctAnswer,
        correctIndex: q1.correctIndex,
        hint: pairA.rule,
        explanation: pairA.rule,
      },
      {
        id: `${baseId}-2`,
        type: 'multiple_choice',
        prompt: `Grammar & Usage Check (Level ${globalLevelNumber}): ${pairB.q}`,
        options: q2.options,
        correctAnswer: q2.correctAnswer,
        correctIndex: q2.correctIndex,
        hint: pairB.rule,
        explanation: pairB.rule,
      },
      {
        id: `${baseId}-3`,
        type: 'multiple_choice',
        prompt: `Reading & Communication Mastery (Unit ${unitNumber}): Why is "${themeFocus}" important in English?`,
        options: q3.options,
        correctAnswer: q3.correctAnswer,
        correctIndex: q3.correctIndex,
        hint: 'En inglés siempre mantenemos el sujeto explícito y la concordancia del tiempo verbal.',
        explanation: `Dominar "${themeFocus}" te permite comprender historias en inglés y expresarte con naturalidad.`,
      },
    ];
  }

  if (subject === 'reading') {
    const readingSamples = [
      {
        word: 'MA-MÁ',
        full: 'MAMÁ',
        sentence: 'MI MAMÁ ME AMA MUCHO.',
        meaning: 'Mamá nos cuida con mucho amor',
        wrongWords: ['PI-EDRA', 'TREN-ES', 'CO-HETE'],
        wrongMeanings: ['El reloj está apagado', 'La silla es de madera', 'El barco navega lejos'],
      },
      {
        word: 'LU-NA',
        full: 'LUNA',
        sentence: 'LA LUNA BRILLA EN LA NOCHE.',
        meaning: 'La Luna ilumina el cielo nocturno',
        wrongWords: ['CA-MIÓN', 'TAM-BOR', 'ZAP-ATO'],
        wrongMeanings: ['El perro corre por el patio', 'La sopa está muy fría', 'El lápiz pinta de verde'],
      },
      {
        word: 'PA-TO',
        full: 'PATO',
        sentence: 'EL PATO NADA EN EL LAGO AZUL.',
        meaning: 'El pato nada feliz en el agua del lago',
        wrongWords: ['BOS-QUE', 'VEN-TANA', 'CAM-PANA'],
        wrongMeanings: ['El avión vuela entre las nubes', 'La puerta está cerrada', 'El tambor suena fuerte'],
      },
      {
        word: 'SO-PA',
        full: 'SOPA',
        sentence: 'PAPÁ PREPARA UNA SOPA RICA.',
        meaning: 'Papá cocina una sopa deliciosa en casa',
        wrongWords: ['ES-TRELLA', 'MON-TAÑA', 'BIC-ICLETA'],
        wrongMeanings: ['La rana salta en el charco', 'El tren llega a la estación', 'El gato duerme en el sofá'],
      },
      {
        word: 'CA-SA',
        full: 'CASA',
        sentence: 'MI CASA TIENE FLORES DE COLORES.',
        meaning: 'En la casa hay flores hermosas y coloridas',
        wrongWords: ['TOR-TUGA', 'HEL-ADO', 'CO-RNETA'],
        wrongMeanings: ['El pez nada bajo el mar', 'La nieve cae en invierno', 'El globo sube al cielo'],
      },
    ];

    const sample = readingSamples[(globalLevelNumber - 1) % readingSamples.length];
    const q1 = buildOptionsWithCorrectIndex(
      `${sample.word} → ${sample.full}`,
      sample.wrongWords as [string, string, string],
      idx0
    );
    const q2 = buildOptionsWithCorrectIndex(
      sample.meaning,
      sample.wrongMeanings as [string, string, string],
      idx1
    );
    const q3 = buildOptionsWithCorrectIndex(
      `Leemos de izquierda a derecha uniendo los sonidos con claridad (${themeFocus})`,
      [
        'Cerramos el libro sin mirar las letras ni escuchar los sonidos',
        'Saltamos todas las vocales sin pronunciarlas',
        'Leemos únicamente la última letra de cada página',
      ],
      idx2
    );

    return [
      {
        id: `${baseId}-1`,
        type: 'syllable_builder',
        prompt: `[${unitTitle} · Nivel ${globalLevelNumber}] ¡Une las sílabas en voz alta! ¿Cómo suena la palabra "${sample.full}"?`,
        subtitle: `Toca el botón de voz para escuchar y elige las sílabas correctas de ${sample.full}.`,
        audioText: `Une las sílabas: ${sample.word}. Forma la palabra ${sample.full}.`,
        options: q1.options,
        correctAnswer: q1.correctAnswer,
        correctIndex: q1.correctIndex,
        hint: `Escucha el primer sonido de ${sample.full}: ${sample.word}.`,
        explanation: `¡Muy bien! Al juntar ${sample.word} leemos la palabra completa ${sample.full}.`,
      },
      {
        id: `${baseId}-2`,
        type: 'multiple_choice',
        prompt: `Lee y escucha la frase: "${sample.sentence}" ¿Qué nos cuenta esta oración?`,
        audioText: sample.sentence,
        options: q2.options,
        correctAnswer: q2.correctAnswer,
        correctIndex: q2.correctIndex,
        hint: `Vuelve a escuchar con atención: "${sample.sentence}"`,
        explanation: `¡Excelente comprensión lectora! "${sample.sentence}" significa que ${sample.meaning.toLowerCase()}.`,
      },
      {
        id: `${baseId}-3`,
        type: 'multiple_choice',
        prompt: `Paso de Gran Lector (Lección ${globalLevelNumber}): ¿Cómo practicamos hoy ${themeFocus}?`,
        audioText: `Hoy aprendemos ${themeFocus} leyendo cada sílaba con alegría.`,
        options: q3.options,
        correctAnswer: q3.correctAnswer,
        correctIndex: q3.correctIndex,
        hint: 'Cada letra tiene un sonido amigo que al unirse forma sílabas y palabras.',
        explanation: `¡Bravo! Paso a paso dominas ${themeFocus}.`,
      },
    ];
  }

  if (subject === 'orthography') {
    const orthoRules = [
      {
        prompt: 'Elige la oración escrita con ortografía y acentuación 100% impecables:',
        ok: 'Ayer caminábamos por el bosque cuando vimos un búho en el árbol.',
        bad: [
          'Aller caminávamos por el vosque cuando bimos un buho en el arbol.',
          'Ayer caminabamos por el bosque cuando vimos un búo en el árbol.',
          'Ayer caminábamos por el bosque cuando bimos un búho en el arbol.',
        ],
        rule: 'Las terminaciones -ábamos llevan B y tilde por ser esdrújulas; "búho" lleva tilde de hiato acentual y "árbol" es grave terminada en L.',
      },
      {
        prompt: 'Selecciona la opción que aplica correctamente los homófonos "a ver / haber" y "hecho / echo":',
        ok: 'Vamos a ver si, de hecho, ha podido haber una solución creativa.',
        bad: [
          'Vamos haber si, de echo, a podido a ver una solución creatiba.',
          'Vamos a ver si, de echo, ha podido haber una solusión creativa.',
          'Bamos a ver si, de hecho, a podido haber una solución creativa.',
        ],
        rule: '"A ver" es preposición + verbo ver; "de hecho" proviene del verbo hacer (con H); "haber" es el infinitivo auxiliar.',
      },
      {
        prompt: '¿En cuál de estas series todas las palabras están correctamente escritas con C, S, Z y G, J?',
        ok: 'El pasajero protegió a los peces y agradeció la gentileza con paciencia.',
        bad: [
          'El pasagero protejió a los peses y agradesió la gentileza con pasiencia.',
          'El pasajero protegió a los pezes y agradeció la jentileza con paciencia.',
          'El pasajero protejió a los peces y agradecio la gentileza con paciensia.',
        ],
        rule: 'Las terminaciones en -aje/-jero van con J; "proteger" va con G ante E/I; el plural de "pez" cambia Z por C ("peces").',
      },
    ];

    const item = orthoRules[(globalLevelNumber - 1) % orthoRules.length];
    const q1 = buildOptionsWithCorrectIndex(item.ok, item.bad as [string, string, string], idx0);
    const q2 = buildOptionsWithCorrectIndex(
      item.rule,
      [
        'Las tildes se colocan únicamente al azar según el largo de la oración',
        'Todas las palabras terminadas en vocal llevan siempre H intermedia',
        'Nunca se escribe B antes de las consonantes L o R',
      ],
      idx1
    );
    const q3 = buildOptionsWithCorrectIndex(
      `Aplicar con precisión ${themeFocus} para que el mensaje sea claro y profesional`,
      [
        'Omitir los signos de interrogación y las comas en todos los párrafos',
        'Confundir las sílabas tónicas con las átonas al escribir',
        'Escribir sin revisar la concordancia ni la puntuación final',
      ],
      idx2
    );

    return [
      {
        id: `${baseId}-1`,
        type: 'dictation_fill',
        prompt: `[${unitTitle} · Nivel ${globalLevelNumber}] ${item.prompt}`,
        audioText: item.ok,
        options: q1.options,
        correctAnswer: q1.correctAnswer,
        correctIndex: q1.correctIndex,
        hint: item.rule,
        explanation: item.rule,
      },
      {
        id: `${baseId}-2`,
        type: 'multiple_choice',
        prompt: `Fundamento Normativo (Lección ${globalLevelNumber}): ¿Qué regla explica la respuesta correcta del ejercicio anterior?`,
        options: q2.options,
        correctAnswer: q2.correctAnswer,
        correctIndex: q2.correctIndex,
        hint: 'Analiza las terminaciones verbales, los hiatos y los cambios consonánticos.',
        explanation: item.rule,
      },
      {
        id: `${baseId}-3`,
        type: 'multiple_choice',
        prompt: `Dominio de Redacción (Unidad ${unitNumber}): ¿Cuál es el objetivo práctico de ejercitar ${themeFocus}?`,
        options: q3.options,
        correctAnswer: q3.correctAnswer,
        correctIndex: q3.correctIndex,
        hint: 'La buena ortografía da claridad, precisión y belleza a nuestras ideas.',
        explanation: `Dominar ${themeFocus} fortalece tu expresión escrita en cualquier ámbito académico.`,
      },
    ];
  }

  // Default: 'prayer'
  const q1 = buildOptionsWithCorrectIndex(
    '1 Padre Nuestro en la cuenta grande, 10 Avemarías en las cuentas pequeñas y 1 Gloria al final',
    [
      'Solamente 3 Credos seguidos sin meditar ningún Misterio',
      '10 Padres Nuestros y ninguna Ave María en toda la decena',
      'Pasar las cuentas en silencio sin recordar la vida de Jesús',
    ],
    idx0
  );
  const q2 = buildOptionsWithCorrectIndex(
    `Meditar ${themeFocus} con paz interior, gratitud y amor al prójimo`,
    [
      'Repetir palabras con prisa sin pensar en su significado',
      'Olvidar agradecer por la familia y por las personas que nos rodean',
      'Distraerse sin escuchar la enseñanza del Evangelio',
    ],
    idx1
  );
  const q3 = buildOptionsWithCorrectIndex(
    'Perdonar de corazón, ayudar con alegría en casa y actuar siempre con verdad y bondad',
    [
      'Guardar enojo y no compartir con los compañeros',
      'Dejar de ayudar a quienes necesitan una palabra amable',
      'Pensar únicamente en uno mismo sin empatía',
    ],
    idx2
  );

  return [
    {
      id: `${baseId}-1`,
      type: 'multiple_choice',
      prompt: `[${unitTitle} · Lección ${globalLevelNumber}] Al rezar una decena del Santo Rosario, ¿qué oraciones acompañan la meditación del Misterio?`,
      audioText: 'En cada decena rezamos un Padre Nuestro, diez Avemarías y un Gloria.',
      options: q1.options,
      correctAnswer: q1.correctAnswer,
      correctIndex: q1.correctIndex,
      hint: 'Recuerda la cuenta grande inicial, las 10 cuentas pequeñas y la alabanza final a la Trinidad.',
      explanation: 'Cada decena se compone de 1 Padre Nuestro, 10 Avemarías y 1 Gloria mientras contemplamos el Misterio.',
    },
    {
      id: `${baseId}-2`,
      type: 'multiple_choice',
      prompt: `Reflexión Paso a Paso (Nivel ${globalLevelNumber}): ¿Qué actitud interior cultivamos al profundizar en ${themeFocus}?`,
      options: q2.options,
      correctAnswer: q2.correctAnswer,
      correctIndex: q2.correctIndex,
      hint: 'La oración auténtica une la atención de la mente con la bondad del corazón.',
      explanation: `Al meditar ${themeFocus}, llenamos el corazón de serenidad, gratitud y fortaleza.`,
    },
    {
      id: `${baseId}-3`,
      type: 'multiple_choice',
      prompt: `Vida Cotidiana y Valores (Unidad ${unitNumber}): ¿Cómo se refleja en el día a día lo aprendido en esta lección?`,
      options: q3.options,
      correctAnswer: q3.correctAnswer,
      correctIndex: q3.correctIndex,
      hint: 'El fruto de la oración se nota en la amabilidad, el perdón y el servicio a los demás.',
      explanation: 'La oración da frutos concretos de caridad, paciencia, respeto y alegría en la familia y la escuela.',
    },
  ];
}

/**
 * Generador Curricular Estructurado:
 * Toma la lista base de cursos y expande cada curso para que tenga exactamente
 * **100 lecciones completas**, divididas en **10 Unidades temáticas de 10 lecciones cada una**
 * (Nivel 1 Principiante hasta Nivel 100 Experto / Proyecto Maestro).
 * Conserva intactos los IDs y ejercicios de las primeras lecciones existentes para compatibilidad total,
 * normalizando también sus opciones para variar `correctIndex` y añadiendo metadatos de Unidad y Teoría.
 */
export function expandCoursesTo100LessonsPerSubject(baseCourses: Course[]): Course[] {
  return baseCourses.map((course) => {
    const unitsCatalog = getUnitsCatalogForSubject(course.subject, course.ageGroup);
    const unitsMetadata: CourseUnitMetadata[] = unitsCatalog.map((u, idx) => ({
      unitNumber: idx + 1,
      title: u.unitTitle,
      subtitle: u.unitSubtitle,
      levelBadge: UNIT_LEVEL_BADGES[idx] || `Nivel ${idx + 1}`,
    }));

    const full100Lessons: LessonItem[] = [];

    for (let levelNum = 1; levelNum <= 100; levelNum++) {
      const unitIndex = Math.floor((levelNum - 1) / 10);
      const unitNumber = unitIndex + 1;
      const lessonInUnit = ((levelNum - 1) % 10) + 1;
      const unitSpec = unitsCatalog[unitIndex] || unitsCatalog[0];
      const existingLesson = course.lessons[levelNum - 1];

      if (existingLesson) {
        // Conservamos el ID original de las primeras lecciones pero aseguramos que tenga al menos 3 ejercicios variados
        // y que correctIndex varíe entre 0, 1, 2 y 3
        const generatedFallbackExercises = generateExercisesForLesson({
          subject: course.subject,
          ageGroup: course.ageGroup,
          unitNumber,
          lessonInUnit,
          globalLevelNumber: levelNum,
          unitTitle: unitSpec.unitTitle,
          themeFocus: unitSpec.themeFocus,
        });

        const normalizedExistingExercises: LessonExercise[] = existingLesson.exercises.map(
          (ex, exIdx) => {
            if (ex.options && ex.correctAnswer) {
              const others = ex.options.filter((o) => o !== ex.correctAnswer);
              const fallbackPool = (
                generatedFallbackExercises[exIdx]?.options ||
                generatedFallbackExercises[0]?.options ||
                []
              ).filter(
                (fo) => fo !== ex.correctAnswer && !others.includes(fo)
              );
              let fIdx = 0;
              while (others.length < 3 && fIdx < fallbackPool.length) {
                others.push(fallbackPool[fIdx++]);
              }
              const totalCount = others.length + 1;
              const targetIdx = (levelNum + exIdx) % totalCount;
              const reordered: string[] = [];
              let dCursor = 0;
              for (let i = 0; i < totalCount; i++) {
                if (i === targetIdx) {
                  reordered.push(ex.correctAnswer);
                } else {
                  reordered.push(others[dCursor++]);
                }
              }
              return {
                ...ex,
                options: reordered,
                correctIndex: targetIdx,
                explanation:
                  ex.explanation ||
                  `Respuesta correcta: ${ex.correctAnswer}. ${ex.hint}`,
              };
            }
            return ex;
          }
        );

        const combinedExercises = [
          ...normalizedExistingExercises,
          ...generatedFallbackExercises.slice(normalizedExistingExercises.length),
        ];

        full100Lessons.push({
          ...existingLesson,
          levelNumber: levelNum,
          unitNumber,
          unitTitle: unitSpec.unitTitle,
          lessonInUnit,
          theorySummary:
            existingLesson.theorySummary ||
            `${unitSpec.unitTitle} (${UNIT_LEVEL_BADGES[unitIndex]}): En esta lección aprenderás paso a paso sobre ${unitSpec.themeFocus}. Lee cada pista con calma antes de responder.`,
          exercises: combinedExercises,
        });
      } else {
        const lessonPhaseTitles = [
          'Conceptos Clave y Fundamentos',
          'Exploración Guiada Paso a Paso',
          'Práctica Aplicada en Contexto',
          'Resolución de Casos Reales',
          'Laboratorio Interactivo de Dominio',
          'Análisis de Errores Frecuentes',
          'Estrategia y Rapidez Mental',
          'Conexión Avanzada de Conceptos',
          'Desafío Pre-Evaluación de Unidad',
          'Proyecto Maestro de cierre de Unidad',
        ];
        const phaseTitle =
          lessonPhaseTitles[lessonInUnit - 1] || `Misión ${lessonInUnit}`;

        const exercises = generateExercisesForLesson({
          subject: course.subject,
          ageGroup: course.ageGroup,
          unitNumber,
          lessonInUnit,
          globalLevelNumber: levelNum,
          unitTitle: unitSpec.unitTitle,
          themeFocus: unitSpec.themeFocus,
        });

        full100Lessons.push({
          id: `l-${course.subject}-${course.ageGroup}-${levelNum}`,
          title: `Lección ${levelNum} (U${unitNumber}.${lessonInUnit}): ${phaseTitle}`,
          description: `${unitSpec.unitSubtitle} · Enfoque práctico en ${unitSpec.themeFocus}.`,
          theorySummary: `${unitSpec.unitTitle} · ${UNIT_LEVEL_BADGES[unitIndex]}: Esta lección desarrolla "${phaseTitle}" aplicado a ${unitSpec.themeFocus}. Revisa el razonamiento paso a paso en cada ejercicio.`,
          levelNumber: levelNum,
          unitNumber,
          unitTitle: unitSpec.unitTitle,
          lessonInUnit,
          xpReward: 45 + unitNumber * 5,
          durationMinutes: 4 + Math.floor(unitNumber / 3),
          exercises,
        });
      }
    }

    return {
      ...course,
      units: unitsMetadata,
      lessons: full100Lessons,
    };
  });
}
