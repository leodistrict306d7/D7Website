// @ts-nocheck
import { NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';
import VectorSearch from '../../../lib/vector-search.js';
import SimpleSearch from '../../../lib/simple-search.js';
import fs from 'fs';
import path from 'path';
import {
  getRecentProjects,
  getAvailableCourses
} from '../../../lib/firestore-data';

// Initialize search engines
const vectorSearchEngine = new VectorSearch();
const simpleSearchEngine = new SimpleSearch();

// Initialize APIs - Hybrid approach: Hugging Face for embeddings, OpenRouter for text generation
const useHuggingFaceEmbeddings = !!process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY !== 'your_huggingface_api_key';
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const useOpenRouter = !!openRouterApiKey && openRouterApiKey !== 'your_openrouter_api_key_here';

const hf = useHuggingFaceEmbeddings ? new HfInference(process.env.HUGGINGFACE_API_KEY) : null;

console.log(`Chat API initialized with: Vector Search + ${useOpenRouter ? 'OpenRouter Text' : ''} + ${useHuggingFaceEmbeddings ? 'Hugging Face Embeddings' : 'Enhanced Rule-based System'}`);

// Load structured data from embeddings
const STRUCTURED_DATA = loadStructuredData();

function loadStructuredData() {
  let uniqueMembers: any[] = [];
  let uniqueClubs: any[] = [];
  let uniqueProjects: any[] = [];

  try {
    const embeddingsPath = path.join(process.cwd(), 'data/embeddings.json');

    if (fs.existsSync(embeddingsPath)) {
      const embeddingsData = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));
      const councilMembers: any[] = [];
      const clubs: any[] = [];
      const projects: any[] = [];

      // Extract structured data from embeddings
      embeddingsData.forEach((doc: any) => {
        if (doc.metadata && doc.metadata.structuredData) {
          const structured = doc.metadata.structuredData;

          if (structured.councilMembers) {
            councilMembers.push(...structured.councilMembers);
          }
          if (structured.clubs) {
            clubs.push(...structured.clubs);
          }
          if (structured.projects) {
            projects.push(...structured.projects);
          }
        }
      });

      // Remove duplicates
      uniqueMembers = removeDuplicates(councilMembers, 'name');
      uniqueClubs = removeDuplicates(clubs, 'name');
      uniqueProjects = removeDuplicates(projects, 'title');

      console.log(`Loaded ${uniqueMembers.length} council members, ${uniqueClubs.length} clubs, ${uniqueProjects.length} projects from structured data`);

      return {
        councilMembers: uniqueMembers,
        clubs: uniqueClubs,
        projects: uniqueProjects
      };
    }
  } catch (error) {
    console.log('Could not load structured data:', error instanceof Error ? error.message : error);
  }

  // Fallback hardcoded council member data if structured data extraction fails
  const fallbackData = {
    councilMembers: [
      {
        name: "Leo Lion Nipuni Wijesekara",
        position: "District President",
        contact: "+94 77 624 3300",
        bio: "Leading Leo District 306 D7 with the theme 'Forge the Future'",
        type: "District President",
        source: "fallback-data"
      },
      {
        name: "Leo Lion Tehan Nakandala",
        position: "District Vice President",
        contact: "",
        bio: "Supporting the District President in leading district initiatives",
        type: "District Vice President",
        source: "fallback-data"
      },
      {
        name: "Leo Misal Silva",
        position: "District Secretary",
        contact: "",
        bio: "Handling administrative matters and district communications",
        type: "District Secretary",
        source: "fallback-data"
      },
      {
        name: "Leo Lion Muthula Liyanage",
        position: "District Treasurer",
        contact: "",
        bio: "Managing financial matters and district budget",
        type: "District Treasurer",
        source: "fallback-data"
      }
    ],
    clubs: [],
    projects: []
  };

  // Return fallback data if no structured data was found
  if (uniqueMembers.length === 0 && uniqueClubs.length === 0 && uniqueProjects.length === 0) {
    console.log('Using fallback council member data');
    return fallbackData;
  }

  return { councilMembers: uniqueMembers, clubs: uniqueClubs, projects: uniqueProjects };
}

function removeDuplicates(array: any[], key: string) {
  const seen = new Set();
  return array.filter((item: any) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

// Enhanced Knowledge Base with comprehensive district information
const DISTRICT_KNOWLEDGE = {
  leadership: {
    president: {
      name: "Leo Lion Nipuni Wijesekara",
      title: "District President",
      contact: "+94 77 624 3300",
      theme: "Forge the Future"
    },
    vicePresident: {
      name: "Leo Lion Tehan Nakandala",
      title: "District Vice President"
    },
    secretary: {
      name: "Leo Misal Silva",
      title: "District Secretary"
    },
    treasurer: {
      name: "Leo Lion Muthula Liyanage",
      title: "District Treasurer"
    },
    chairperson: {
      name: "Leo Lion Rahul Attanayake",
      title: "District Leo Club Chairperson"
    }
  },
  district: {
    name: "Leo District 306 D7",
    coverage: ["Colombo District", "Ratnapura District"],
    clubs: 37,
    members: "over 2,000",
    parent: "Lions Clubs International Multiple District 306 – Sri Lanka",
    website: "d7leos.org",
    email: "leodistrict306d7@gmail.com",
    phone: "+94 77 624 3300"
  },
  values: {
    moto: "Leadership, Experience, and Opportunity",
    theme: "Forge the Future",
    mission: "Fostering leadership through service by empowering youth, building communities, and creating impact"
  }
};

// Enhanced Pattern Matching System
class IntelligentResponseEngine {
  patterns: any;

  constructor() {
    this.patterns = this.initializePatterns();
  }

  initializePatterns() {
    return {
      // Council Member Recognition (Highest Priority)
      councilMembers: [
        {
          patterns: this.generateCouncilMemberPatterns(),
          response: (query: string) => this.findCouncilMemberResponse(query)
        }
      ],

      // Leadership Questions
      leadership: [
        {
          patterns: ['vice president', 'district vice president'],
          response: () => `${DISTRICT_KNOWLEDGE.leadership.vicePresident.name} serves as the ${DISTRICT_KNOWLEDGE.leadership.vicePresident.title} of ${DISTRICT_KNOWLEDGE.district.name}. He plays a crucial role in supporting the District President and leading various district initiatives. You can contact the district leadership at ${DISTRICT_KNOWLEDGE.district.email} or ${DISTRICT_KNOWLEDGE.district.phone}.`
        },
        {
          patterns: ['president', 'district president'],
          response: () => `${DISTRICT_KNOWLEDGE.leadership.president.name} is the current ${DISTRICT_KNOWLEDGE.leadership.president.title} of ${DISTRICT_KNOWLEDGE.district.name}. She leads our district with the theme '${DISTRICT_KNOWLEDGE.leadership.president.theme}' and can be contacted at ${DISTRICT_KNOWLEDGE.leadership.president.contact}.\n\nTogether We Lead, Together We Serve — ${DISTRICT_KNOWLEDGE.district.name}.`
        },
        {
          patterns: ['secretary', 'district secretary'],
          response: () => `${DISTRICT_KNOWLEDGE.leadership.secretary.name} serves as the ${DISTRICT_KNOWLEDGE.leadership.secretary.title} of ${DISTRICT_KNOWLEDGE.district.name}. You can reach out to the district leadership at ${DISTRICT_KNOWLEDGE.district.email} or ${DISTRICT_KNOWLEDGE.district.phone} for any administrative matters.`
        },
        {
          patterns: ['treasurer', 'district treasurer'],
          response: () => `${DISTRICT_KNOWLEDGE.leadership.treasurer.name} is the ${DISTRICT_KNOWLEDGE.leadership.treasurer.title} of ${DISTRICT_KNOWLEDGE.district.name}. For any financial matters or donations, please contact the district leadership at ${DISTRICT_KNOWLEDGE.district.email}.`
        },
        {
          patterns: ['chairperson', 'district chairperson'],
          response: () => `${DISTRICT_KNOWLEDGE.leadership.chairperson.name} serves as the ${DISTRICT_KNOWLEDGE.leadership.chairperson.title} for ${DISTRICT_KNOWLEDGE.district.name}. He plays a key role in coordinating between all our Leo clubs and supporting district initiatives.`
        }
      ],

      // District Information
      district: [
        {
          patterns: ['what is', 'about', 'tell me about'],
          response: () => `${DISTRICT_KNOWLEDGE.district.name} is a vibrant district of Leo Clubs operating under ${DISTRICT_KNOWLEDGE.district.parent}. We serve the ${DISTRICT_KNOWLEDGE.district.coverage.join(' and ')} districts with ${DISTRICT_KNOWLEDGE.district.clubs} Leo Clubs and ${DISTRICT_KNOWLEDGE.district.members} Leos.\n\nOur mission is to ${DISTRICT_KNOWLEDGE.values.mission}. We're guided by our motto '${DISTRICT_KNOWLEDGE.values.theme}' and the Leo spirit of ${DISTRICT_KNOWLEDGE.values.moto}.\n\nVisit ${DISTRICT_KNOWLEDGE.district.website} to learn more about our projects and leadership!`
        },
        {
          patterns: ['how many clubs', 'number of clubs'],
          response: () => `${DISTRICT_KNOWLEDGE.district.name} currently has ${DISTRICT_KNOWLEDGE.district.clubs} Leo Clubs! This includes both Alpha Leo Clubs (school-based) and Omega Leo Clubs (community-based) across the ${DISTRICT_KNOWLEDGE.district.coverage.join(' and ')} districts. Each club plays a vital role in serving their communities and developing youth leadership.`
        },
        {
          patterns: ['how many members', 'number of members'],
          response: () => `We're proud to have ${DISTRICT_KNOWLEDGE.district.members} active Leos in ${DISTRICT_KNOWLEDGE.district.name}! This makes us one of the largest and most active Leo districts in Sri Lanka. Our members range from students to young professionals, all united in service to their communities.`
        },
        {
          patterns: ['coverage', 'area', 'districts'],
          response: () => `${DISTRICT_KNOWLEDGE.district.name} covers ${DISTRICT_KNOWLEDGE.district.coverage.length} Sri Lankan districts: the ${DISTRICT_KNOWLEDGE.district.coverage.join(' and the ')}. This allows us to serve communities in both urban and rural areas, bringing the Leo spirit of service to diverse communities across Sri Lanka.`
        }
      ],

      // Membership & Joining
      membership: [
        {
          patterns: ['join', 'membership', 'become'],
          response: () => `We'd love to have you join our Leo family! 🦁\n\n${DISTRICT_KNOWLEDGE.district.name} has ${DISTRICT_KNOWLEDGE.district.clubs} Alpha and Omega Leo Clubs across ${DISTRICT_KNOWLEDGE.district.coverage.join(' and ')} districts. To get started:\n\n1. Visit ${DISTRICT_KNOWLEDGE.district.website} to explore our directory and find a club near you\n2. Contact our district leadership at ${DISTRICT_KNOWLEDGE.district.email} or ${DISTRICT_KNOWLEDGE.district.phone}\n3. Attend a club meeting as a guest to experience the Leo spirit\n4. Complete the membership process through your chosen club\n\nOur clubs include prestigious schools like Royal College, Ananda College, and universities like University of Sri Jayewardenepura.\n\nProudly representing the Leos of ${DISTRICT_KNOWLEDGE.district.name}!`
        },
        {
          patterns: ['age', 'old'],
          response: () => `Leo Club membership is open to young people aged 12-30. We have Alpha Leo Clubs for school students (12-18 years) and Omega Leo Clubs for young adults (18-30 years). This allows youth to develop leadership skills through service from their teenage years through early adulthood.`
        }
      ],

      // Greetings & Basic
      greetings: [
        {
          patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
          response: () => `Hello and welcome! I'm your Ascent Assistant, and I'm thrilled to tell you about ${DISTRICT_KNOWLEDGE.district.name}! 🦁\n\nWe're an amazing community of ${DISTRICT_KNOWLEDGE.district.members} young leaders across ${DISTRICT_KNOWLEDGE.district.clubs} clubs, serving communities in ${DISTRICT_KNOWLEDGE.district.coverage.join(' and ')} districts. Our theme is '${DISTRICT_KNOWLEDGE.values.theme}' and we're all about developing leadership through service.\n\nWhat would you like to know about our district? I can tell you about our projects, how to join, our leadership, or anything else about the Leo movement!`
        },
        {
          patterns: ['thank', 'thanks'],
          response: () => `You're very welcome! I'm always here to help you learn more about ${DISTRICT_KNOWLEDGE.district.name}. It's wonderful that you're interested in our district and the work we do! 🦁\n\nIs there anything specific about our Leo clubs, projects, or how to get involved that you'd like to know more about? Together We Lead, Together We Serve!`
        }
      ]
    };
  }

  // Advanced pattern matching with context awareness
  generateResponse(question, searchResults = []) {
    const lowerQuestion = question.toLowerCase();

    // Check all pattern categories
    for (const patterns of Object.values(this.patterns)) {
      for (const pattern of patterns) {
        const matches = pattern.patterns.some(p => lowerQuestion.includes(p.toLowerCase()));
        if (matches) {
          // If response expects arguments, pass question
          if (pattern.response.length > 0) {
            return pattern.response(question);
          }
          return pattern.response();
        }
      }
    }

    // If no pattern matches, use enhanced fallback
    return this.generateContextualResponse(question, searchResults);
  }

  // Enhanced contextual response generation
  generateContextualResponse(question, searchResults) {
    if (searchResults.length > 0) {
      // Use search results to generate contextual response
      const context = searchResults.slice(0, 2).map(result => result.document.chunk).join(' ');
      return this.generateSmartResponse(question, context);
    }

    // Default intelligent response
    return this.generateDefaultResponse(question);
  }

  generateSmartResponse(question, context) {
    // Simple context-based response generation
    if (context.toLowerCase().includes('project') || question.toLowerCase().includes('project')) {
      return `${DISTRICT_KNOWLEDGE.district.name} is renowned for impactful service projects across our communities! 🌟\n\nOur Leos regularly organize community service initiatives, environmental sustainability projects, youth development programs, educational support activities, and health and wellness campaigns.\n\nCheck out our D7 All-Rounders section to see outstanding achievements by our Leos beyond service work, and visit ${DISTRICT_KNOWLEDGE.district.website}/projects for current initiatives!\n\nTogether We Lead, Together We Serve — ${DISTRICT_KNOWLEDGE.district.name}.`;
    }

    return this.generateDefaultResponse(question);
  }

  generateDefaultResponse(_question) {
    return `Thank you for your interest in ${DISTRICT_KNOWLEDGE.district.name}! 🦁\n\nAs your Ascent Assistant, I'm here to help you learn about our amazing district of ${DISTRICT_KNOWLEDGE.district.clubs} Leo clubs and ${DISTRICT_KNOWLEDGE.district.members} passionate young leaders. Whether you're interested in joining, our projects, leadership opportunities, or just want to know more about what we do, I'm happy to help!\n\nFor the most comprehensive information, visit ${DISTRICT_KNOWLEDGE.district.website}, or reach out to us directly:\n- Email: ${DISTRICT_KNOWLEDGE.district.email}\n- Phone: ${DISTRICT_KNOWLEDGE.district.phone}\n\nTogether We Lead, Together We Serve — ${DISTRICT_KNOWLEDGE.district.name}!`;
  }

  // Generate patterns for council member recognition
  generateCouncilMemberPatterns() {
    const patterns = ['who is', 'tell me about', 'information about', 'details about'];

    // Add council member names (with safety check)
    if (STRUCTURED_DATA && STRUCTURED_DATA.councilMembers && STRUCTURED_DATA.councilMembers.length > 0) {
      STRUCTURED_DATA.councilMembers.forEach(member => {
        if (member.name) {
          patterns.push(member.name.toLowerCase());

          // Add last name only
          const nameParts = member.name.split(' ');
          if (nameParts.length > 1) {
            patterns.push(nameParts[nameParts.length - 1].toLowerCase());
          }
        }

        // Add position keywords
        if (member.position) {
          patterns.push(member.position.toLowerCase());
        }

        // Add member type
        if (member.type) {
          patterns.push(member.type.toLowerCase());
        }
      });
    }

    // Add hardcoded patterns for fallback data
    patterns.push('nipuni', 'wijesekara', 'hansathi', 'imethma', 'tehan', 'nakandala', 'misal', 'silva', 'muthula', 'liyanage');
    patterns.push('district president', 'district vice president', 'district secretary', 'district treasurer');

    return patterns;
  }

  // Find council member response
  findCouncilMemberResponse(query) {
    const lowerQuery = query.toLowerCase();

    // Real council member data from the website
    const realCouncilData = [
      {
        name: "Leo Lion Nipuni Wijesekara",
        position: "District President",
        contact: "+94 77 624 3300",
        bio: "Leading Leo District 306 D7 with the theme 'Forge the Future'",
        type: "District President"
      },
      {
        name: "Leo Lion Tehan Nakandala",
        position: "District Vice President",
        contact: "",
        bio: "Supporting the District President in leading district initiatives",
        type: "District Vice President"
      },
      {
        name: "Leo Misal Silva",
        position: "District Secretary",
        contact: "",
        bio: "Handling administrative matters and district communications",
        type: "District Secretary"
      },
      {
        name: "Leo Lion Muthula Liyanage",
        position: "District Treasurer",
        contact: "",
        bio: "Managing financial matters and district budget",
        type: "District Treasurer"
      },
      {
        name: "Leo Lion Rahul Attanayake",
        position: "District Leo Club Chairperson",
        contact: "",
        bio: "Leading Leo club development and coordination",
        type: "District Leo Club Chairperson"
      },
      {
        name: "Leo Lion Hansathi Imethma",
        position: "Immediate Past District President",
        contact: "",
        bio: "Previous District President serving as a district leader",
        type: "Immediate Past District President"
      }
    ];

    // Search in real council data
    for (const member of realCouncilData) {
      const memberName = member.name.toLowerCase();
      const nameParts = member.name.split(' ');
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : '';

      if (lowerQuery.includes(memberName) ||
          (lastName && lowerQuery.includes(lastName)) ||
          lowerQuery.includes(member.position.toLowerCase())) {

        let response = `${member.name} serves as ${member.position} in Leo District 306 D7.`;

        if (member.contact) {
          response += ` Contact: ${member.contact}`;
        }

        if (member.bio && member.bio.length > 20) {
          response += ` ${member.bio}`;
        }

        response += ` You can reach out to the district leadership at ${DISTRICT_KNOWLEDGE.district.email} or ${DISTRICT_KNOWLEDGE.district.phone} for more information.`;

        return response;
      }
    }

    // If no specific member found, return a helpful response
    return `I'd be happy to help you find information about our council members! Leo District 306 D7 has dedicated council members serving in various leadership positions.

Our current leadership includes:
- District President: Leo Lion Nipuni Wijesekara
- District Vice President: Leo Lion Tehan Nakandala
- District Secretary: Leo Misal Silva
- District Treasurer: Leo Lion Muthula Liyanage
- District Leo Club Chairperson: Leo Lion Rahul Attanayake

For specific information about any council member, please ask for them by name or position. You can also contact the district leadership at ${DISTRICT_KNOWLEDGE.district.email} or ${DISTRICT_KNOWLEDGE.district.phone}.`;
  }
}

async function generateEmbedding(text) {
  try {
    if (!hf) {
      throw new Error('Hugging Face embeddings not available');
    }
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: text
    });
    return Array.from(response);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Enhanced AI response generation using OpenRouter
async function generateAIResponse(question, context) {
  if (!useOpenRouter) {
    throw new Error('OpenRouter not available');
  }

  const prompt = `As Ascent Assistant, the official guide of Leo District 306 D7, answer this question naturally and knowledgeably: "${question}"

Context: ${context}

District Facts:
- District: Leo District 306 D7
- President: Leo Lion Nipuni Wijesekara
- Immediate Past President: Leo Lion Hansathi Imethma
- Theme: "Forge the Future"
- Coverage: Colombo and Ratnapura districts
- Clubs: 37 Leo Clubs
- Members: Over 2,000 Leos
- Contact: leodistrict306d7@gmail.com, +94 77 624 3300

Respond as a knowledgeable district leader. Be direct, helpful, and encouraging. Keep answers under 200 words.`;

  try {
    // Use OpenRouter API with a reliable free model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://d7leos.org',
        'X-Title': 'Ascent Assistant - Leo District 306 D7'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'You are Ascent Assistant, the official guide of Leo District 306 D7. You are knowledgeable, helpful, and encouraging. You provide accurate information about the district, leadership, projects, and membership.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 250,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Clean and format response
    return data.choices[0].message.content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/^\s+/, '')
      .trim();
  } catch (error) {
    console.error('AI generation failed:', error);
    throw error;
  }
}

// Enhanced council member response function for natural language questions
function getCouncilMemberResponse(message) {
  const lowerMessage = message.toLowerCase();

  // Common question patterns to extract names/positions
  const questionPatterns = [
    /who is\s+([a-z\s]+?)(?:\?|$)/i,
    /tell me about\s+([a-z\s]+?)(?:\?|$)/i,
    /information about\s+([a-z\s]+?)(?:\?|$)/i,
    /details about\s+([a-z\s]+?)(?:\?|$)/i,
    /what about\s+([a-z\s]+?)(?:\?|$)/i,
    /([a-z\s]+?)(?:\?|$)/i  // Fallback: take first part
  ];

  let extractedName = null;

  // Try to extract name/position from question
  for (const pattern of questionPatterns) {
    const match = lowerMessage.match(pattern);
    if (match && match[1]) {
      extractedName = match[1].trim();
      break;
    }
  }

  // If no extraction, use the full message
  const searchTerms = extractedName || lowerMessage;

  // Real council member data from the website
  const councilMembers = [
    {
      name: "Leo Lion Nipuni Wijesekara",
      position: "District President",
      contact: "+94 77 624 3300",
      bio: "Leading Leo District 306 D7 with the theme 'Forge the Future'",
      keywords: ["nipuni", "wijesekara", "president", "district president"]
    },
    {
      name: "Leo Lion Tehan Nakandala",
      position: "District Vice President",
      contact: "",
      bio: "Supporting the District President in leading district initiatives",
      keywords: ["tehan", "nakandala", "vice president", "district vice president"]
    },
    {
      name: "Leo Misal Silva",
      position: "District Secretary",
      contact: "",
      bio: "Handling administrative matters and district communications",
      keywords: ["misal", "silva", "secretary", "district secretary"]
    },
    {
      name: "Leo Lion Muthula Liyanage",
      position: "District Treasurer",
      contact: "",
      bio: "Managing financial matters and district budget",
      keywords: ["muthula", "liyanage", "treasurer", "district treasurer"]
    },
    {
      name: "Leo Lion Rahul Attanayake",
      position: "District Leo Club Chairperson",
      contact: "",
      bio: "Leading Leo club development and coordination",
      keywords: ["rahul", "attanayake", "chairperson", "club chairperson"]
    },
    {
      name: "Leo Lion Hansathi Imethma",
      position: "Immediate Past District President",
      contact: "",
      bio: "Previous District President serving as a district leader",
      keywords: ["hansathi", "imethma", "past president", "immediate past president"]
    }
  ];

  // Enhanced matching logic
  for (const member of councilMembers) {
    const memberName = member.name.toLowerCase();
    const memberPosition = member.position.toLowerCase();
    const nameParts = member.name.split(' ');
    const firstName = nameParts.length >= 3 ? nameParts[2].toLowerCase() : ''; // "Leo Lion [FirstName] [LastName]"
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : '';

    // Check if any keyword matches
    const keywordMatch = member.keywords.some(keyword =>
      searchTerms.includes(keyword) || keyword.includes(searchTerms)
    );

    // Check various name matching patterns
    const nameMatch = memberName.includes(searchTerms) ||
                     (firstName && firstName.includes(searchTerms)) ||
                     (lastName && lastName.includes(searchTerms)) ||
                     searchTerms.includes(firstName) ||
                     searchTerms.includes(lastName);

    // Check position matching
    const positionMatch = memberPosition.includes(searchTerms) ||
                         searchTerms.includes(memberPosition);

    if (keywordMatch || nameMatch || positionMatch) {
      // Generate contextual response based on question type
      let response;

      if (lowerMessage.includes('who is') || lowerMessage.includes('tell me about')) {
        response = `${member.name} is the ${member.position} of Leo District 306 D7. `;
      } else if (lowerMessage.includes('contact') || lowerMessage.includes('reach')) {
        response = `${member.name} can be reached through the district leadership channels. `;
      } else {
        response = `${member.name} serves as ${member.position} in Leo District 306 D7. `;
      }

      if (member.contact) {
        response += `You can contact them at ${member.contact}. `;
      }

      if (member.bio) {
        response += `${member.bio} `;
      }

      response += `For more information, reach out to the district leadership at leodistrict306d7@gmail.com or +94 77 624 3300.`;

      return response;
    }
  }

  return null; // No council member found
}

// Helper function to generate contextual responses from search results
async function generateContextualResponse(message, _context) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('recent project') || lowerMessage.includes('latest project') || lowerMessage.includes('current project')) {
    try {
      const recentProjects = await getRecentProjects(8);

      if (recentProjects.length > 0) {
        let response = `Here are the recent projects from Leo District 306 D7:\n\n`;

        recentProjects.forEach((project) => {
          const statusIcon = project.status === 'completed' ? '✅' : project.status === 'ongoing' ? '🔄' : '🆕';
          response += `${statusIcon} **${project.title}**\n`;
          response += `   ${project.description}\n`;
          response += `   Category: ${project.category} | Date: ${project.date}\n`;
          if (project.location) response += `   Location: ${project.location}\n`;
          if (project.beneficiaries) response += `   Beneficiaries: ${project.beneficiaries}\n`;
          response += '\n';
        });

        response += `For more details about these projects or information on how to participate, please contact the district leadership at leodistrict306d7@gmail.com.`;
        return response;
      } else {
        return `I don't see any specific recent projects listed in our current database. However, Leo District 306 D7 typically organizes projects in categories like service activities, youth programs, orientations, religious initiatives, and club meetings.\n\nFor the most current project information, I'd recommend:\n1. Checking our latest "Ascent" newsletter on d7leos.org\n2. Contacting the district leadership directly at leodistrict306d7@gmail.com\n3. Speaking with your local Leo Club leadership\n\nWould you like information about any specific type of project?`;
      }
    } catch (error) {
      console.error('Error fetching recent projects:', error);
      return `I'm having trouble accessing our projects database right now. For the most current information on recent projects and initiatives, please contact our district leadership at leodistrict306d7@gmail.com or check our latest "Ascent" newsletter on d7leos.org.`;
    }
  }

  if (lowerMessage.includes('project') || lowerMessage.includes('service')) {
    return `Leo District 306 D7 is actively involved in various community service projects across Colombo and Ratnapura districts. Our Leos regularly organize initiatives focused on community development, environmental sustainability, youth education, and health awareness programs.\n\nOur projects generally fall into categories like service activities, youth programs, orientations, religious initiatives, and club meetings. For specific details about current projects, I'd recommend visiting d7leos.org/projects or contacting our district leadership at leodistrict306d7@gmail.com. We're always looking for volunteers and supporters for our service initiatives!`;
  }

  if (lowerMessage.includes('lms') || lowerMessage.includes('course') || lowerMessage.includes('enroll') || lowerMessage.includes('training')) {
    try {
      const availableCourses = await getAvailableCourses(10);

      if (availableCourses.length > 0) {
        let response = `**Leo District 306 D7 Learning Management System - Available Courses:**\n\n`;

        availableCourses.forEach((course) => {
          const statusIcon = course.enrollmentStatus === 'open' ? '📚' : course.enrollmentStatus === 'coming-soon' ? '🆕' : '🔒';
          const levelIcon = course.level === 'beginner' ? '🟢' : course.level === 'intermediate' ? '🟡' : '🔴';

          response += `${statusIcon} **${course.title}** ${levelIcon}\n`;
          response += `   ${course.description}\n`;
          response += `   Category: ${course.category} | Level: ${course.level}\n`;
          response += `   Duration: ${course.duration}\n`;
          if (course.instructor) response += `   Instructor: ${course.instructor}\n`;
          if (course.startDate) response += `   Start Date: ${course.startDate}\n`;
          if (course.enrollmentLink) response += `   Enrollment: Available through LMS\n`;
          response += `   Status: ${course.enrollmentStatus.replace('-', ' ')}\n\n`;
        });

        response += `**How to Enroll:**\n`;
        response += `1. Visit d7leos.org and click "Login to LMS"\n`;
        response += `2. Use your Leo credentials to access the course catalog\n`;
        response += `3. Select your desired course and follow the enrollment instructions\n`;
        response += `4. For enrollment assistance, contact the district leadership at leodistrict306d7@gmail.com\n\n`;
        response += `For access credentials or enrollment support, please reach out to your club leadership or the district team.`;

        return response;
      } else {
        return `**Leo District 306 D7 Learning Management System:**\n\nOur district offers an LMS platform accessible through the "Login to LMS" button on d7leos.org. The LMS typically includes:\n\n• **Leadership Development Courses**: Training for club officers and members\n• **Project Management Modules**: Best practices for service project planning\n• **Leo Movement Orientation**: Introduction to Leoism and club operations\n• **Skills Development Workshops**: Personal and professional growth programs\n\n**For Enrollment and Course Information:**\n1. Visit d7leos.org and click "Login to LMS"\n2. Contact the district leadership at leodistrict306d7@gmail.com for access credentials\n3. Reach out to your club leadership for district-provided training opportunities\n4. Check our "Ascent" newsletter for announcements about new courses\n\nFor the most current course offerings and enrollment procedures, I'd recommend contacting the District leadership directly, as course availability and enrollment processes may vary throughout the year.`;
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      return `I'm having trouble accessing our course database right now. For information about LMS courses and enrollment, please visit d7leos.org and click "Login to LMS" or contact the district leadership at leodistrict306d7@gmail.com for assistance.`;
    }
  }

  if (lowerMessage.includes('join') || lowerMessage.includes('membership')) {
    return `Joining Leo District 306 D7 is a fantastic way to develop leadership skills while serving your community! We have 37 Leo clubs across Colombo and Ratnapura districts, with options for both school students (Alpha Leos) and young professionals (Omega Leos).\n\nTo get started:\n1. Visit d7leos.org to find a club near you\n2. Contact the district leadership at leodistrict306d7@gmail.com or +94 77 624 3300\n3. Attend a club meeting as a guest\n4. Complete the membership process\n\nOur theme this year is "Forge the Future" - we'd love to have you join us in making a positive impact!`;
  }

  if (lowerMessage.includes('club') || lowerMessage.includes('clubs')) {
    return `Leo District 306 D7 has 37 active Leo clubs serving communities across Colombo and Ratnapura districts. Our clubs include both school-based Alpha Leo clubs and community-based Omega Leo clubs, providing opportunities for young people aged 12-30 to develop leadership skills through service.\n\nEach club has its own focus areas and projects, but all work under our district theme "Forge the Future." For information about specific clubs or meeting locations, visit d7leos.org or contact our district leadership.`;
  }

  // Default contextual response
  return `Thank you for your interest in Leo District 306 D7! Based on our district information, we're a vibrant community of over 2,000 young leaders serving across Colombo and Ratnapura districts. Our theme this year is "Forge the Future," and we're committed to developing leadership through service.\n\nFor more detailed information about specific topics, please feel free to ask about our clubs, projects, leadership team, or how to get involved. You can also visit d7leos.org or contact us at leodistrict306d7@gmail.com.`;
}

// Enhanced POST Handler with Hybrid Intelligence System
export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log(`Processing query: "${message}"`);

    // Direct council member recognition (bypass broken pattern matching)
    const councilResponse = getCouncilMemberResponse(message);
    if (councilResponse) {
      console.log('Council member recognized, returning direct response');
      return NextResponse.json({
        response: councilResponse,
        sources: []
      });
    }

    // Enhanced Firestore data integration for specific question types
    const lowerMessage = message.toLowerCase();

    // Handle recent projects queries with Firestore data
    if (lowerMessage.includes('recent project') || lowerMessage.includes('latest project') || lowerMessage.includes('current project')) {
      console.log('Detected recent projects query, fetching from Firestore...');
      try {
        const recentProjects = await getRecentProjects(8);
        if (recentProjects.length > 0) {
          let response = `Here are the recent projects from Leo District 306 D7:\n\n`;

          recentProjects.forEach((project) => {
            const statusIcon = project.status === 'completed' ? '✅' : project.status === 'ongoing' ? '🔄' : '🆕';
            response += `${statusIcon} **${project.title}**\n`;
            response += `   ${project.description}\n`;
            response += `   Category: ${project.category} | Date: ${project.date}\n`;
            if (project.location) response += `   Location: ${project.location}\n`;
            if (project.beneficiaries) response += `   Beneficiaries: ${project.beneficiaries}\n`;
            response += '\n';
          });

          response += `For more details about these projects or information on how to participate, please contact the district leadership at leodistrict306d7@gmail.com.`;

          return NextResponse.json({
            response,
            sources: []
          });
        }
      } catch (error) {
        console.error('Error fetching recent projects:', error);
      }
    }

    // Handle LMS and course queries with Firestore data
    if (lowerMessage.includes('lms') || lowerMessage.includes('course') || lowerMessage.includes('enroll') || lowerMessage.includes('training')) {
      console.log('Detected LMS/courses query, fetching from Firestore...');
      try {
        const availableCourses = await getAvailableCourses(10);
        if (availableCourses.length > 0) {
          let response = `**Leo District 306 D7 Learning Management System - Available Courses:**\n\n`;

          availableCourses.forEach((course) => {
            const statusIcon = course.enrollmentStatus === 'open' ? '📚' : course.enrollmentStatus === 'coming-soon' ? '🆕' : '🔒';
            const levelIcon = course.level === 'beginner' ? '🟢' : course.level === 'intermediate' ? '🟡' : '🔴';

            response += `${statusIcon} **${course.title}** ${levelIcon}\n`;
            response += `   ${course.description}\n`;
            response += `   Category: ${course.category} | Level: ${course.level}\n`;
            response += `   Duration: ${course.duration}\n`;
            if (course.instructor) response += `   Instructor: ${course.instructor}\n`;
            if (course.startDate) response += `   Start Date: ${course.startDate}\n`;
            if (course.enrollmentLink) response += `   Enrollment: Available through LMS\n`;
            response += `   Status: ${course.enrollmentStatus.replace('-', ' ')}\n\n`;
          });

          response += `**How to Enroll:**\n`;
          response += `1. Visit d7leos.org and click "Login to LMS"\n`;
          response += `2. Use your Leo credentials to access the course catalog\n`;
          response += `3. Select your desired course and follow the enrollment instructions\n`;
          response += `4. For enrollment assistance, contact the district leadership at leodistrict306d7@gmail.com\n\n`;
          response += `For access credentials or enrollment support, please reach out to your club leadership or the district team.`;

          return NextResponse.json({
            response,
            sources: []
          });
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    }

    // Load knowledge base if not already loaded
    if (vectorSearchEngine.documents.length === 0) {
      const loaded = await vectorSearchEngine.loadData();
      if (!loaded) {
        console.log('Vector knowledge base not available, trying simple search...');
      }
    }
    
    if (simpleSearchEngine.documents.length === 0) {
      await simpleSearchEngine.loadData();
    }

    let searchResults = [];
    let searchMethod = 'keyword';

    // Try vector search with embedding generation
    try {
      if (hf && vectorSearchEngine.documents.length > 0) {
        console.log('Attempting vector search with embeddings...');
        const queryEmbedding = await generateEmbedding(message);
        searchResults = vectorSearchEngine.search(queryEmbedding, 5);
        searchMethod = 'vector';
      } else {
        throw new Error('Hugging Face not available or vector data missing');
      }
    } catch (error) {
      console.log(`Vector search failed, falling back to keyword search: ${error.message}`);
      searchResults = simpleSearchEngine.search(message, 5);
      searchMethod = 'keyword';
    }

    console.log(`Search method: ${searchMethod}, Results found: ${searchResults.length}`);

    // Council member recognition already handled leadership questions perfectly above
    // Skip broken pattern matching and proceed to intelligent response generation

    // Layer 2: AI-Powered Response (if available and appropriate)
    if (useOpenRouter && searchResults.length > 0) {
      try {
        console.log('Attempting AI-powered response with OpenRouter...');
        const context = searchResults.slice(0, 3).map(result => result.document.chunk).join('\n\n');
        const aiResponse = await generateAIResponse(message, context);

        // Only use AI response if it's substantial and relevant
        if (aiResponse && aiResponse.length > 50 && !aiResponse.includes('As an AI')) {
          console.log('AI response generated successfully');
          return NextResponse.json({
            response: aiResponse,
            sources: searchResults.slice(0, 3).map(result => ({
              title: result.document.title,
              url: result.document.url,
              similarity: result.similarity
            }))
          });
        }
      } catch (error) {
        console.log(`AI response failed, using enhanced pattern matching: ${error.message}`);
      }
    }

    // Layer 3: Intelligent Fallback Response (Guaranteed working response)
    console.log('Using intelligent fallback response generation');

    // Generate a helpful response based on the search results or district knowledge
    let fallbackResponse;

    if (searchResults.length > 0) {
      // Use search results to provide context
      const context = searchResults[0].document.chunk;
      fallbackResponse = await generateContextualResponse(message, context);
    } else {
      // Use district knowledge for general queries
      fallbackResponse = generateGeneralDistrictResponse(message);
    }

    return NextResponse.json({
      response: fallbackResponse,
      sources: searchResults.slice(0, 2).map(result => ({
        title: result.document.title,
        url: result.document.url,
        similarity: result.similarity
      }))
    });

  } catch (error) {
    console.error('Chat API error:', error);

    // Ultimate fallback - guaranteed response even if everything fails
    const fallbackResponseEngine = new IntelligentResponseEngine();
    const fallbackResponse = fallbackResponseEngine.generateDefaultResponse('general query');

    return NextResponse.json({
      response: fallbackResponse,
      sources: []
    });
  }
}