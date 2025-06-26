// FUNCIÓN PARA CLAUDE API - Compatible con DuoCapital
// Mantener nombre chat-gemini.js para compatibilidad con HTML

const COMPANY_CONTEXT = `
Eres el asistente virtual de DuoCapital, el nexo estratégico que une a JRO Asesorías y al Instituto de Capacitación Tecnipro.

INFORMACIÓN CLAVE DE DUOCAPITAL:
- DuoCapital NO es una empresa de servicios, es un nexo estratégico
- Une a dos empresas líderes: JRO Asesorías e Instituto de Capacitación Tecnipro
- Más de 15 años de experiencia conjunta
- Más de 50 organizaciones transformadas
- 97% de satisfacción de clientes

SOBRE JRO ASESORÍAS:
- Especialistas en inteligencia de negocios y automatización
- Servicios principales:
  * Power BI: Dashboards ejecutivos en tiempo real
  * Power Automate: Automatización de procesos críticos
  * Estrategia Digital: Roadmap de transformación
  * Gobierno de Datos: Seguridad y compliance
- Resultados promedio: 75% reducción en tiempo de análisis, 40% ahorro en costos
- Sitio web: www.jroasesorias.cl

SOBRE INSTITUTO DE CAPACITACIÓN TECNIPRO:
- Especialistas en formación corporativa con cobertura SENCE
- Servicios principales:
  * Programas con cobertura SENCE hasta 100%
  * Certificaciones Microsoft oficiales
  * Talleres in-company personalizados
  * Formación en competencias digitales
- Plataforma e-learning 24/7 con instructores certificados
- Sitio web: www.tecnipro.cl

CLIENTES DESTACADOS:
Ministerio de Obras Públicas, Pontificia Universidad Católica, Universidad Andrés Bello, 
Fuerza Aérea de Chile, Armada de Chile, DHL, APL Logistics, ACHS, Hospital Militar, 
Colun, BancoEstado Corredores, Ripley, entre otros.

CONTACTO:
- Teléfono: +569 6689 5746
- Email: info@duocapital.cl
- Ubicación: Santiago, Chile

INSTRUCCIONES PARA EL ASISTENTE:
1. Sé profesional pero cercano
2. Siempre menciona que DuoCapital conecta con dos empresas especializadas
3. Identifica las necesidades del cliente y oriéntalo hacia JRO o Tecnipro según corresponda
4. Si preguntan por precios, indica que cada empresa maneja sus propias tarifas
5. Destaca los resultados y casos de éxito
6. Si detectas interés concreto, sugiere agendar una reunión
7. Responde en español chileno profesional
`;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Manejar preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const { message, history = [] } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Mensaje requerido' })
      };
    }

    // Obtener API key desde variables de entorno
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      console.error('ERROR: CLAUDE_API_KEY no configurada en variables de entorno');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Chat temporalmente deshabilitado. Por favor contacte a info@duocapital.cl o llame al +569 6689 5746' 
        })
      };
    }

    // Preparar mensajes para Claude API
    const messages = history.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
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
        model: 'claude-3-haiku-20240307', // Modelo económico y rápido
        messages: messages,
        system: COMPANY_CONTEXT,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error de Claude API:', response.status, errorData);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text;

    // Detectar si es un lead caliente
    const hotLeadKeywords = [
      'precio', 'costo', 'valor', 'cotizar', 'cotización',
      'contratar', 'agendar', 'reunión', 'demo', 'demostración',
      'urgente', 'necesito', 'implementar', 'cuándo', 'presupuesto'
    ];
    
    const isHotLead = hotLeadKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    // Log para análisis (opcional)
    if (isHotLead) {
      console.log('HOT LEAD detectado:', { message, timestamp: new Date().toISOString() });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: responseText,
        isHotLead: isHotLead
      })
    };

  } catch (error) {
    console.error('Error en chat function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error al procesar su consulta. Por favor intente nuevamente o contacte directamente a info@duocapital.cl'
      })
    };
  }
};