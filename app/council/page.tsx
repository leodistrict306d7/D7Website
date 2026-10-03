"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface SectionItem {
  name: string;
  role?: string;
  photo?: string; // absolute path under /public
  biography?: string;
  gallery?: string[];
}
interface Section {
  title: string;
  items: SectionItem[];
}

interface ModalData {
  name: string;
  role: string;
  photo: string;
  biography: string;
  gallery: string[];
}

const photo = (file: string | undefined) => (file ? `/images/council/${file}` : '/logos/lion.png');

const sections: Section[] = [
  {
    title: 'District Executives',
    items: [
      { role: 'District President', name: 'Leo Lion Nipuni Wijesekara', photo: photo('Nipuni.jpg') },
      { role: 'Immediate Past District President', name: 'Leo Lion Hansathi Imethma', photo: photo('Hansathi.jpg') },
      { role: 'District Leo Chairperson', name: 'Lion Viduranga Maddumage', photo: photo('Viduranga.jpg') },
      { role: 'District Vice President', name: 'Leo Lion Tehan Nakandala', photo: photo('Tehan.jpg') },
      { role: 'District Secretary', name: 'Leo Misal Silva', photo: photo('Misal.jpg') },
      { role: 'District Treasurer', name: 'Leo Lion Muthula Liyanage', photo: photo('Muthula.jpg') },
      { role: 'District Membership Chairperson', name: 'Leo Manith Fernando', photo: photo('Manith.jpg') },
      { role: 'Assistant District Secretary', name: 'Leo Pamudi Anuththara', photo: photo('Pamudi.jpg') },
      { role: 'Assistant District Treasurer', name: 'Leo Kisara Ranasinghe', photo: photo('Kisara.jpg') },
      { role: 'Assistant District Treasurer', name: 'Leo Lion Anuk Nisalitha', photo: photo('Anuk.jpg') },
    ],
  },
  {
    title: 'District Directors',
    items: [
      { role: 'Director of Leo Club Expansion & Development', name: 'Leo lion Thisaruni Wijebandara', photo: photo('Thisaruni.jpg') },
      { role: 'Assistant Director of Creative Marketing and Branding', name: 'Leo Lion Lithira Ramuditha', photo: photo('Lithira.jpg') },
      { role: 'Director of Digital Media & Technology', name: 'Leo Senath Minu Dewmith', photo: photo('Minu.jpg') },
      { role: 'Director of Finance & Fundraising', name: 'Leo Lion Ravinya Dimuth Senevirathna', photo: photo('Ravinya.jpg') },
      { role: 'Assistant Director of Finance & Fundraising', name: 'Leo Lion Davindu Wickramasinghe', photo: photo('Davindu.jpg') },
      { role: 'Director of Editorial & Content Writing', name: 'Leo Ruhaim Riyaz', photo: photo('Ruhaim.jpg') },
      { role: 'Assistant Director of Editorial & Content Writing', name: 'Leo Chethya Hettiarachchi', photo: photo('Chethya.jpg') },
      { role: 'District Contest Director', name: 'Leo Melissa Handapangoda', photo: photo('Melissa.jpg') },      
      { role: 'Assistant Director of Administration & Club Performance', name: 'Leo Sathsari Samaranayake FLM', photo: photo('Sathsari.jpg') },
      { role: 'Director of Creative Marketing and Branding', name: 'Leo Chamudini Wijenayake', photo: photo('Chamudini.jpg') },
      { role: 'Director of Operations & Service', name: 'Leo Ravija Liyanage', photo: photo('Ravija.jpg') },
      { role: 'Assistant Director of Operations & Service', name: 'Leo Hasanka Lakshan', photo: photo('Hansaka.jpg') },
    ],
  },  
  {
    title: 'Region Directors',
    items: [
      { role: 'Region Director', name: 'Leo Lion Tharushi Dharmajeewa', photo: photo('Dharmajeewa.jpg') },
      { role: 'Region Director', name: 'Leo Lion Akithma Gunatillake FLM/PFLM', photo: photo('Akithma.jpg') },
      { role: 'Region Director', name: 'Leo Lion Thavisha Bandara', photo: photo('Thavisha.jpg') },
      { role: 'Region Director', name: 'Leo Hiruna Rathnayaka', photo: photo('Hiruna.jpg') },
    ],
  },
  {
    title: 'Zone Directors',
    items: [
      { role: 'Zone Director', name: 'Leo Ilmi Sanjali Pathirage' , photo: photo('sanjali.jpg') },
      { role: 'Zone Director', name: 'Leo Lion Lasith Saranga', photo: photo('Lasith.jpg') },
      { role: 'Zone Director', name: 'Leo Kenul Dissanayake', photo: photo('Kenul.jpg') },
      { role: 'Zone Director', name: 'Leo Dewnaka Pansidu' , photo: photo('Dewnaka.jpg') },
      { role: 'Zone Director', name: 'Leo Sathis Sandul Dunukumara Gangaboda', photo: photo('Sathis.jpg') },
    ],
  },
  {
    title: 'District Cordinators',
    items: [
     { role: 'Chief Coordinator - Career Development & Professional Growth', name: 'Leo Piyumi Chathurika Iwdugoda', photo: photo('Piyumi.jpg') },
      { role: 'Chief Coordinator - Innovation & Special Initiatives', name: 'Leo Pasan Mendis', photo: photo('Pasan.jpg') },
      { role: 'Chief Coordinator - Internal Engagement', name: 'Leo Himashi Dewmini Lokuge', photo: photo('Himashi.jpg') },
      { role: 'Chief Coordinator - Outstation Affairs', name: 'Leo Nethum Rupasinghe', photo: photo('Nethum.jpg') },
      { role: 'Chief Coordinator - Global Impact & Partnerships', name: 'Leo Malina Methman Kalupahana', photo: photo('Malina.jpg') },
    ],
  },
  {
    title: 'Support Team',
    items: [
      { name: 'Leo Lion Manuth Ranawaka', role: 'Director of Digital Media & Technology', photo: photo('Manuth.jpg') },
      { name: 'Leo Lion Chiran Damsara Hitinamaluwa', role: 'Team Member of Leo Club Expansion & Development Team', photo: photo('Chiran.jpg') },
      { name: 'Leo Sankha Amarasinghe', role: 'Team Member of Creative Marketing and Branding Team', photo: photo('Sankha.jpg') },
      { name: 'Leo Navodi Tharushika Liyanage', role: 'Team Member of Creative Marketing and Branding Team', photo: photo('Navodi.jpg') },
      { name: 'Leo Lehansa Poojani Wijayaratne', role: 'Team Member of Administration & Club Performance Team', photo: photo('Poojani.jpg') },
      { name: 'Leo Lion Theekshana Lakshan', role: 'Team Member of Operations & Service Team', photo: photo('Theekshana.jpg') },
      { name: 'Leo Lion Dinith Randula Wijesundara', role: 'Team Member of Operations & Service Team', photo: photo('Dinith.JPG') },
      { name: 'Leo Shenal Jerusha Cooray', role: 'Team Member of Finance & Fundraising Team' },
      { name: 'Leo Senuri Wickramarachchi', role: 'Team Member of Editorial & Content Writing Team', photo: photo('Senuri.jpg') },
    ],
  },
];

// Modal Component
function OfficialModal({ data, onClose }: { data: ModalData | null; onClose: () => void }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!data) return null;

  const nextImage = () => {
    if (!data.gallery?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % data.gallery.length);
  };

  const prevImage = () => {
    if (!data.gallery?.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + data.gallery.length) % data.gallery.length);
  };

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/90 dark:bg-black/70 overscroll-contain"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto overscroll-contain bg-white/95 dark:bg-black/95 text-gray-900 dark:text-white mx-2 sm:mx-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="flex-1 pr-2">
                <h2 className="heading-serif text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">{data.name}</h2>
                <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mt-1">{data.role}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-full glass hover:bg-gray-200/50 dark:hover:bg-white/20 transition-colors text-gray-700 dark:text-gray-300 flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Left side - Photo and Gallery */}
            <div className="space-y-3 sm:space-y-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-black/5">
                <img
                  src={data.photo}
                  alt={data.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/coming-soon.svg'; }}
                />
              </div>

              {/* Gallery Slideshow */}
              {data.gallery && data.gallery.length > 1 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Journey Gallery</h3>
                  <div className="relative">
                    <div className="aspect-video rounded-lg overflow-hidden bg-black/5">
                      <img
                        src={data.gallery[currentImageIndex]}
                        alt={`${data.name} gallery ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                        loading="eager"
                        decoding="async"
                        draggable={false}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/coming-soon.svg'; }}
                      />
                    </div>
                    
                    {/* Gallery Navigation */}
                    <div className="flex justify-between items-center mt-2">
                      <button
                        onClick={prevImage}
                        className="p-1.5 sm:p-2 rounded-full glass hover:bg-gray-200/50 dark:hover:bg-white/20 transition-colors text-gray-700 dark:text-gray-300 touch-manipulation"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <div className="flex gap-1.5 sm:gap-2 items-center">
                        {data.gallery?.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors touch-manipulation ${
                              index === currentImageIndex 
                                ? 'bg-gray-800 dark:bg-white' 
                                : 'bg-gray-400 dark:bg-white/40'
                            }`}
                          />
                        )) || []}
                      </div>
                      
                      <button
                        onClick={nextImage}
                        className="p-1.5 sm:p-2 rounded-full glass hover:bg-gray-200/50 dark:hover:bg-white/20 transition-colors text-gray-700 dark:text-gray-300 touch-manipulation"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Biography */}
            <div className="mt-6 md:mt-0">
              <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 text-gray-900 dark:text-white">Biography</h3>
              <div
                className="opacity-90 leading-relaxed space-y-3 sm:space-y-4 biography-content text-gray-800 dark:text-gray-200 text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: data.biography }}
              />
            </div>
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CouncilPage() {
  const [selectedOfficial, setSelectedOfficial] = useState<ModalData | null>(null);

  // Check if an official should have a modal (key positions)
  const shouldShowModal = (role: string) => {
    const keyRoles = [
      'District President',
      'Immediate Past District President',
      'Immediate Past District President / District Contest Director',
      'District Leo Club Chairperson',
      'District Governor',
      'Immediate Past District Governor',
      'District Vice President'
    ];
    return keyRoles.includes(role);
  };

  const handleOfficialClick = (item: SectionItem) => {
    if (shouldShowModal(item.role || '') && item.biography && item.gallery) {
      setSelectedOfficial({
        name: item.name,
        role: item.role || '',
        photo: item.photo || '/logos/lion.png',
        biography: item.biography,
        gallery: item.gallery
      });
    }
  };

  return (
    <div className="space-y-10">
      <h1 className="heading-serif text-3xl font-bold">District Council</h1>

      {sections.map((section) => (
        <section key={section.title} className="space-y-5">
          <h2 className="heading-serif text-2xl font-semibold">{section.title}</h2>
          <div className={`flex gap-5 ${(section.title === 'Region Directors' || section.title === 'District Team Heads') ? 'flex-nowrap overflow-x-auto justify-start' : 'flex-wrap justify-center'}`}>
            {section.items.map((m, idx) => (
              <motion.div
                key={`${section.title}-${idx}-${m.name}`}
                className={`surface-card rounded-xl overflow-hidden group ${(section.title === 'Region Directors' || section.title === 'District Team Heads') ? 'w-48 sm:w-56' : 'w-full sm:w-64'} ${
                  shouldShowModal(m.role || '') ? 'cursor-pointer hover:ring-2 hover:ring-rose/40' : ''
                }`}
                whileHover={{ y: -6 }}
                onClick={() => handleOfficialClick(m)}
              >
                {/* Square image wrapper */}
                <div className="relative w-full aspect-square overflow-hidden bg-black/5">
                  <img
                    src={m.photo || '/logos/lion.png'}
                    alt={m.name}
                    className="absolute inset-0 h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/coming-soon.svg'; }}
                  />
                  {/* Click indicator for key officials */}
                  {shouldShowModal(m.role || '') && (
                    <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4 text-center">
                  <div className="font-semibold">{m.name}</div>
                  {m.role && <div className="text-sm opacity-70">{m.role}</div>}
                  {shouldShowModal(m.role || '') && (
                    <div className="text-xs opacity-50 mt-1">Click for details</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      ))}

      {/* Modal */}
      <OfficialModal 
        data={selectedOfficial} 
        onClose={() => setSelectedOfficial(null)} 
      />
    </div>
  );
}