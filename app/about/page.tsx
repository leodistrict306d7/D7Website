'use client';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import NextImage from 'next/image';

// Leadership data from council page - ordered: DP, IPDP, DCL, DVP, DS, DT
const leadershipData = [
  { 
    role: 'District President', 
    name: 'Leo Lion Nipuni Wijesekara', 
    photo: '/images/council/nipuni.jpg' 
  },
  { 
    role: 'Immediate Past District President', 
    name: 'Leo Lion Hansathi Imethma', 
    photo: '/images/council/hansathi.jpg' 
  },
  { 
    role: 'District Leo Chairperson', 
    name: 'Lion Viduranga Maddumage', 
    photo: '/images/council/viduranga.jpg' 
  },
  { 
    role: 'District Vice President', 
    name: 'Leo Lion Tehan Nakandala', 
    photo: '/images/council/tehan.jpg' 
  },
  { 
    role: 'District Secretary', 
    name: 'Leo Misal Silva', 
    photo: '/images/council/misal.jpg' 
  },
  { 
    role: 'District Treasurer', 
    name: 'Leo Lion Muthula Liyanage', 
    photo: '/images/council/muthula.jpg' 
  },
];

// D7 All-Rounders data structure (July 2025 - June 2026)


// FAQ data structure
const faqData = [
  {
    question: "What is Lions Clubs International?",
    answer: "Lions Clubs International (LCI) is the largest non-government service organization globally, encompassing a vast network of over 44,500 clubs and over 1.4 million members from 201 countries. With its headquarters situated in Oak Brook, Illinois, United States, LCI is dedicated to addressing the needs of communities on both local and global scales. Since its establishment in 1917, Lions Clubs International has provided countless individuals with the chance to make meaningful contributions to communities."
  },
  {
    question: "What is International Leo Movement?",
    answer: "Leo Clubs is the youth organization of Lions Clubs International, which in its own existence seeks to serve people in need with special emphasis and focus on children while different clubs around the world put their efforts into underprivileged segments diverse and developmental aspects, each and every club shares the same vision and passion to service. They conduct various projects in the fields of Health Care, Projects for Elders, children, and Differently-abled, Literacy & education, and Self Development."
  },
  {
    question: "Who is a LEO?",
    answer: "We are the world's largest youth organisation and the proud youth program of Lions Clubs International. The word L-E-O stands for \"Leadership, Experience, and Opportunity.\" There are many Opportunities an individual could gain by being a Leo, which would provide them with many Experiences to enhance their skills. It is a leadership development program that encourages people to take charge of serving those in need in a diverse underprivileged segment."
  }
];

// FAQ Component
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="heading-serif text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqData.map((faq, index) => (
          <motion.div
            key={index}
            className="glass rounded-xl overflow-hidden"
            initial={false}
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-white/5 transition-colors"
            >
              <h3 className="font-semibold text-lg">{faq.question}</h3>
              <motion.svg
                className="w-5 h-5 flex-shrink-0 ml-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4">
                    <div className="flex items-start gap-4">
                      <p className="opacity-90 leading-relaxed flex-1">{faq.answer}</p>
                      {index === 0 && (
                        <NextImage
                          src="/logos/lion.png"
                          alt="Lions Clubs International"
                          width={96}
                          height={96}
                          className="w-16 h-16 md:w-24 md:h-24 object-contain opacity-90 flex-shrink-0"
                        />
                      )}
                      {index === 1 && (
                        <NextImage
                          src="/logos/leo.png"
                          alt="International Leo Movement"
                          width={96}
                          height={96}
                          className="w-16 h-16 md:w-24 md:h-24 object-contain opacity-90 flex-shrink-0"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// All-Rounders content moved to a dedicated page at /all-rounders

export default function AboutPage() {
  // District Clubs: Alpha (contains 'College', 'Vidyalaya', or 'School') and Omega (others)
  const alphaClubs = [
    'Leo Club of Ananda College',
    'Leo Club of Anula Vidyalaya',
    'Leo Club of Ashoka Vidyalaya',
    'Leo Club of Bomiriya Central College',
    'Leo Club of Carey College',
    'Leo Club of Asian Grammar School',
    'Leo Club of Gankanda Central College',
    'Leo Club of Isipathana College',
    'Leo Club of Lumbini College',
    'Leo Club of Mahanama College',
    'Leo Club of Mahinda Rajapaksha College',
    'Leo Club of Ferguson High School',
    'Leo Club of Pannipitiya Dharmapala Vidyalaya',
    "Leo Club of President's College Maharagama",
    'Leo Club of Royal College',
    'Leo Club of Sivali College',
    "Leo Club of St. Aloysius' College",
    "Leo Club of St. John's College",
    'Leo Club of Thurstan College',
  ];
  const omegaClubs = [
    'Leo Club of Cinnamon Gardens',
    'Leo Club of Colombo Eminence',
    'Leo Club of Colombo Griffins',
    'Leo Club of Colombo Hogwarts',
    'Leo Club of Colombo Knights',
    'Leo Club of Defence Marshals',
    'Leo Club of Gothami Balika',
    'Leo Club of Homagama Central',
    'Leo Club of Kottawa Central Golden City',
    'Leo Club of Kuruwita Paradise',
    'Leo Club of Maharagama Golden City',
    'Leo Club of Nawala Metro',
    'Leo Club of National Institute of Business Management',
    'Leo Club of Pannipitiya Metro Titans',
    'Leo Club of Pannipitiya Paradise',
    'Leo Club of Sabaragamuwa University',
    'Leo Club of University of Sri Jayewardenepura',
  ];

  return (
    <div className="space-y-8">
      <section className="surface-card rounded-2xl p-6">
        <h1 className="heading-serif text-3xl font-bold">About Leo District 306 D7</h1>
        <p className="mt-3 opacity-90">Our district fosters leadership through impactful service. Founded to empower youth, we champion community development, environmental sustainability, and personal growth.</p>
      </section>

      {/* District Motto */}
      <section className="text-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <h2 className="heading-serif text-4xl md:text-6xl font-bold bg-gradient-to-r from-rose via-fuchsia to-crimson bg-clip-text text-transparent px-2 py-1">
            "Forge the Future"
          </h2>
          <div className="mt-2 text-sm opacity-70 font-medium tracking-wider">
            DISTRICT MOTTO
          </div>
        </motion.div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="surface-card rounded-2xl p-6">
          <h2 className="heading-serif text-2xl font-semibold">Mission</h2>
          <ul className="mt-3 list-disc pl-6 space-y-2 text-sm md:text-base opacity-90">
            <li>To inspire and empower Leos to take initiative in creating sustainable change through impactful service.</li>
            <li>To strengthen unity, collaboration, and inclusivity across all clubs, fostering a culture of mutual growth.</li>
            <li>To nurture young leaders with the skills, values, and confidence to face tomorrow’s challenges.</li>
            <li>To embrace innovation and creativity in service, ensuring our projects address the evolving needs of society.</li>
            <li>To carry forward the spirit of Lionism by upholding service, integrity, and dedication in all endeavors.</li>
          </ul>
        </div>
        <div className="surface-card rounded-2xl p-6">
          <h2 className="heading-serif text-2xl font-semibold">Vision</h2>
          <p className="mt-2 opacity-90">To build a dynamic generation of Leos who are empowered with leadership, compassion, and innovation to forge a brighter future for communities and the world.</p>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Leo District 306 D7 Section */}
      <section className="surface-card rounded-2xl p-6">
        <h2 className="heading-serif text-2xl font-semibold mb-6">Leo District 306 D7</h2>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* District Information */}
          <div className="lg:col-span-2 space-y-4">
            <div className="surface-card rounded-xl p-4">
              <h3 className="font-semibold text-lg mb-3">District Coverage</h3>
              <p className="opacity-90">Leo District 306 D7 consists of two Sri Lankan body districts: <strong>Colombo District</strong> and <strong>Ratnapura District</strong>.</p>
            </div>
            
            <div className="surface-card rounded-xl p-4">
              <h3 className="font-semibold text-lg mb-3">Our Strength</h3>
              <p className="opacity-90">Leo District 306 D7 consists of <strong>37 Leo Clubs</strong> with more than <strong>2,000 Leos</strong>. Leo District 306 D7 has been renowned to be one of the best Leo Districts in the world.</p>
            </div>
            
            <div className="surface-card rounded-xl p-4">
              <h3 className="font-semibold text-lg mb-3">Our Legacy</h3>
              <p className="opacity-90">Leo District 306 D7 has always been a forerunner of the Multiple 306. Leo District 306 D7 is considered one of the most active districts which have produced many remarkable leaders to the Leo Movement and even the community. The Leos of Leo District 306 D7 are widely known as very passionate and efficient individuals, as they have always worked united and with determination to ensure the success of any project undertaken.</p>
            </div>
            
            <div className="surface-card rounded-xl p-4">
              <h3 className="font-semibold text-lg mb-3">Historic Milestone</h3>
              <p className="opacity-90">With immense pride, we celebrate the <strong>1st installation of Leo District 306 D7</strong>. This milestone honors our remarkable journey and the incredible achievements to come. As we prepare to establish a brand new Leo District, we carry forward the legacy of excellence and camaraderie that defines us.</p>
              <p className="opacity-90 mt-3">We head towards a remarkable year in Leoism under the leadership of the <strong>District President Leo Lion Nipuni Wijesekara</strong>. We encourage you with your precious greetings and well-wishes for the upcoming Leostic year.</p>
            </div>
          </div>
          
          {/* Map Section */}
          <div className="lg:col-span-1">
            <div className="surface-card rounded-xl p-4 h-full">
              <h3 className="font-semibold text-lg mb-3">District Map</h3>
              <div className="relative rounded-lg overflow-hidden border border-white/20 bg-black/5">
                <div className="relative w-full h-auto">
                  <NextImage
                    src="/images/districtmap.png"
                    alt="District Map showing Colombo and Ratnapura districts"
                    width={1200}
                    height={800}
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="h-auto w-full object-contain"
                    priority={false}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-70">Clubs:</span>
                  <span className="font-semibold">37</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Members:</span>
                  <span className="font-semibold">2,000+</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">District:</span>
                  <span className="font-semibold">1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-6">
        <h2 className="heading-serif text-2xl font-semibold">Leadership</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 justify-items-center">
          {leadershipData.map((leader) => (
            <motion.div 
              whileHover={{ y: -6 }} 
              key={leader.name} 
              className="rounded-xl p-4 surface-card group"
            >
              <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-black/5">
                <NextImage
                  src={leader.photo || '/logos/lion.png'}
                  alt={leader.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-3 text-center">
                <div className="font-semibold text-sm">{leader.name}</div>
                <div className="text-xs opacity-70 mt-1">{leader.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      

      {/* District Clubs */}
      <section className="surface-card rounded-2xl p-6">
        <h2 className="heading-serif text-2xl font-semibold">District Clubs</h2>
        <div className="mt-4 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg">Alpha Leo Clubs</h3>
            <ul className="mt-3 list-disc pl-6 space-y-1 opacity-90 text-sm md:text-base">
              {alphaClubs.map((club) => (
                <li key={club}>{club}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Omega Leo Clubs</h3>
            <ul className="mt-3 list-disc pl-6 space-y-1 opacity-90 text-sm md:text-base">
              {omegaClubs.map((club) => (
                <li key={club}>{club}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

    </div>
  );
}