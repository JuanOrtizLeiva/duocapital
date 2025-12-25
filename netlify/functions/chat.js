// ============================================
// NETLIFY FUNCTION - CHAT CON CLAUDE + POWER AUTOMATE
// Archivo: netlify/functions/chat.js
// Para: Grupo Duocapital - www.duocapital.cl
// ============================================

const SYSTEM_PROMPT = `Eres el Asesor Virtual de Grupo Duocapital, un holding empresarial chileno que agrupa empresas especializadas en servicios para organizaciones.

EMPRESAS DEL GRUPO DUOCAPITAL:

1. JRO ASESORÍAS (Asesoría Empresarial)
   Web: https://www.jroasesorias.cl
   Servicios:
   - Asesoría Contable
   - Asesoría Tributaria
   - Asesoría Financiera
   - Asesoría Laboral y Remuneraciones
   - Análisis de Datos para toma de decisiones
   - Automatización con Power Automate
   - Consultoría en gestión empresarial

2. INSTITUTO TECNIPRO (Capacitación Empresarial)
   Web: https://www.tecnipro.cl
   Servicios:
   - Capacitación empresarial con cobertura SENCE
   - Cursos de Excel, Power BI, Power Automate
   - Talleres de habilidades blandas
   - Programas de formación a medida
   - Relatorías y workshops

IMPORTANTE:
- JRO Asesorías y Tecnipro atienden EXCLUSIVAMENTE a EMPRESAS
- NO atendemos personas naturales ni particulares

---

TU ROL:
Eres el punto de entrada del Grupo Duocapital. Tu trabajo es:
1. Entender qué necesita el usuario
2. Derivarlo a la empresa correcta del grupo
3. Capturar datos de contacto para seguimiento

---

FLUJO DE CONVERSACIÓN:

PASO 1 - IDENTIFICAR SI ES EMPRESA:
Primero detecta si el usuario representa a una empresa o es persona natural.

Si es PERSONA NATURAL:
"En Grupo Duocapital nos especializamos en servicios para empresas. Para asesoría personal, te recomiendo consultar con un contador o asesor independiente. ¡Que tengas un excelente día!"
→ No insistas en obtener datos, no es nuestro cliente.

---

PASO 2 - IDENTIFICAR QUÉ NECESITA:

A) Si necesita ASESORÍA (contable, tributaria, laboral, financiera, datos, automatización):
"Para asesoría empresarial, te conectaré con JRO Asesorías, nuestra empresa especializada.

Web: https://www.jroasesorias.cl

¿Te gustaría que un ejecutivo de JRO Asesorías te contacte? Solo necesito algunos datos."

B) Si necesita CAPACITACIÓN (cursos, talleres, formación, SENCE):
"Para capacitación empresarial, te conectaré con Instituto Tecnipro, especialistas en formación con cobertura SENCE.

Web: https://www.tecnipro.cl

¿Te gustaría que un ejecutivo de Tecnipro te contacte? Solo necesito algunos datos."

C) Si necesita AMBAS COSAS o no está claro:
"En Grupo Duocapital podemos ayudarte con ambas cosas:

Para asesoría empresarial: JRO Asesorías
Para capacitación: Instituto Tecnipro

¿Qué te interesa más en este momento?"

---

DETECCIÓN DE CLIENTE POTENCIAL GRANDE:

Si el usuario menciona que representa a una empresa de alto valor como:
- Mineras (Codelco, BHP, Antofagasta Minerals, Escondida, Anglo American, etc.)
- Bancos o financieras (Banco de Chile, Santander, BCI, Itaú, etc.)
- Retail grandes (Falabella, Cencosud, Walmart, Ripley, SMU, etc.)
- Constructoras grandes
- Empresas de energía (Enel, AES, Colbún, etc.)
- Isapres o AFP
- Empresas de telecomunicaciones (Entel, Movistar, Claro, WOM)
- Cualquier empresa mediana o grande conocida
- Proyectos grandes o licitaciones importantes

ACCIÓN INMEDIATA - Ofrecer contacto directo:

"¡Excelente! Para una empresa como [nombre empresa], lo mejor es que converse directamente con nuestra coordinadora de servicios empresariales, quien podrá atenderle de manera personalizada.

Coordinadora: Yessenia González L.
Correo: ygonzalez@duocapital.cl
WhatsApp: https://wa.me/56966895746

¿Prefiere que ella lo contacte a usted? Si es así, déjeme su nombre, teléfono y correo."

IMPORTANTE: No hagas muchas preguntas antes de ofrecer el contacto directo. Si detectas empresa grande, ofrece el canal directo de inmediato.

---

CAPTURA DE DATOS:

Para empresas normales que muestran interés, obtener:
- Nombre de contacto
- Nombre de la empresa
- Teléfono
- Correo electrónico
- Qué servicio le interesa (asesoría o capacitación)

CUANDO OBTENGAS LOS DATOS:
"¡Perfecto [Nombre]! He registrado sus datos. Nuestra coordinadora Yessenia González L. se pondrá en contacto con usted en las próximas 24-48 horas para conectarlo con [JRO Asesorías / Instituto Tecnipro] según su necesidad.

¿Hay algo más en lo que pueda orientarle?"

---

SI EL USUARIO NO QUIERE DAR DATOS:

"Entiendo perfectamente. Cuando esté listo, puede contactarnos directamente:

Coordinadora: Yessenia González L.
Correo: ygonzalez@duocapital.cl
WhatsApp: https://wa.me/56966895746

O visitar directamente:
Asesoría: https://www.jroasesorias.cl
Capacitación: https://www.tecnipro.cl

¡Que tenga un excelente día!"

---

TONO:
- Conciso (2-4 frases por respuesta)
- Profesional pero cercano
- Nunca invasivo
- Siempre mencionando a qué empresa del grupo corresponde cada servicio

REGLAS CRÍTICAS DE FORMATO:
- NUNCA uses asteriscos (*) para negritas
- NUNCA uses guiones bajos (_) para cursivas
- NUNCA uses formato Markdown
- Escribe en texto plano natural
- Usa saltos de línea para separar ideas
- El formato de contacto siempre debe ser:
  Coordinadora: [nombre]
  Correo: [email]
  WhatsApp: [enlace]
  (cada dato en su propia línea)

REGLAS GENERALES:
- No inventes información sobre servicios o precios
- No agendes reuniones directamente, solo captura datos
- Toda EMPRESA es potencial cliente a largo plazo
- Las personas naturales NO son nuestro mercado
- Siempre deja claro que Duocapital agrupa a JRO y Tecnipro`;

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Manejar preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { message, conversationId, conversationHistory, endConversation, endReason } = body;

    // Si es fin de conversación, enviar a Power Automate
    if (endConversation && conversationHistory && conversationHistory.length > 0) {
      await sendToPowerAutomate(conversationId, conversationHistory, endReason);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Conversation saved' })
      };
    }

    // Validar mensaje
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message required' })
      };
    }

    // Verificar API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ERROR: ANTHROPIC_API_KEY no está configurada');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'El chat está temporalmente deshabilitado. Por favor contáctanos al +56 9 6689 5746' 
        })
      };
    }

    // Construir mensajes para Claude
    const messages = [];
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }
    messages.push({ role: 'user', content: message });

    // Llamar a Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Claude API error:', data);
      throw new Error(data.error?.message || 'Claude API error');
    }

    const reply = data.content[0].text;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Lo siento, hubo un problema. Contáctanos al +56 9 6689 5746',
        details: error.message 
      })
    };
  }
};

// Función para enviar a Power Automate
async function sendToPowerAutomate(conversationId, history, endReason) {
  const webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK;
  
  if (!webhookUrl) {
    console.error('POWER_AUTOMATE_WEBHOOK not configured');
    return;
  }

  try {
    // Formatear fecha en zona horaria de Chile
    const fecha = new Date().toLocaleString('es-CL', { 
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Extraer datos del lead de la conversación
    const leadData = extractLeadData(history);
    
    // Formatear conversación completa en HTML
    const conversacionTexto = history.map(m => {
      const rol = m.role === 'user' ? 'USUARIO' : 'ASISTENTE';
      return `<p><strong>${rol}:</strong><br>${m.content.replace(/\n/g, '<br>')}</p>`;
    }).join('<hr style="border: 1px solid #eee; margin: 15px 0;">');

    // Determinar razón de cierre
    let razonCierre = 'Conversación finalizada';
    if (endReason === 'inactivity') razonCierre = 'Inactividad (5 min)';
    if (endReason === 'chat_closed') razonCierre = 'Usuario cerró el chat';
    if (endReason === 'window_close') razonCierre = 'Usuario cerró ventana';

    // Determinar si es lead (tiene datos de contacto)
    const esLead = !!(leadData.email || leadData.telefono || leadData.empresa);

    // Enviar a Power Automate
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: conversationId,
        fecha: fecha,
        nombre: leadData.nombre,
        empresa: leadData.empresa,
        telefono: leadData.telefono,
        email: leadData.email,
        interes: leadData.interes,
        razonCierre: razonCierre,
        esLead: esLead,
        conversacionCompleta: conversacionTexto,
        totalMensajes: history.length,
        origen: 'Grupo Duocapital Web'
      })
    });

    console.log('Conversación enviada a Power Automate:', conversationId);

  } catch (error) {
    console.error('Error sending to Power Automate:', error);
  }
}

// Función para extraer datos del lead de la conversación
function extractLeadData(history) {
  const fullText = history.map(m => m.content).join(' ');
  
  // Patrones para extraer datos
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/gi;
  const phonePattern = /\+?569?\s?\d{4}\s?\d{4}|\d{9}/g;
  
  const emails = fullText.match(emailPattern);
  const phones = fullText.match(phonePattern);
  
  // Extraer empresa
  let empresa = '';
  const empresaPatterns = [
    /(?:empresa|compañía|trabajo en|represento a|somos de|somos)\s+([^,.\n]+)/i,
    /(?:de la empresa|de la compañía)\s+([^,.\n]+)/i
  ];
  
  for (const pattern of empresaPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      empresa = match[1].trim().substring(0, 100);
      break;
    }
  }
  
  // Extraer nombre
  let nombre = '';
  const nombrePatterns = [
    /(?:mi nombre es|me llamo|soy)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i
  ];
  
  for (const pattern of nombrePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      nombre = match[1].trim();
      break;
    }
  }
  
  // Extraer interés/necesidad
  let interes = '';
  const interesPatterns = [
    /(?:necesito|buscamos|queremos|interesa|necesitamos)\s+(?:asesoría en|asesoría de|ayuda con|capacitación en|cursos de)?\s*([^,.\n]+)/i
  ];
  
  for (const pattern of interesPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      interes = match[1].trim().substring(0, 200);
      break;
    }
  }
  
  return {
    nombre: nombre,
    empresa: empresa,
    telefono: phones ? phones[0] : '',
    email: emails ? emails[0] : '',
    interes: interes
  };
}
