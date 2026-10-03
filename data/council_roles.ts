export type PositionGroup = 'District Executives' | 'Region Directors' | 'Zone Directors' | 'Team Members' | 'Chief Coordinators' | string;

export interface CouncilRole {
  group: PositionGroup;
  position: string;
  name: string;
}

export const COUNCIL_ROLES: CouncilRole[] = [
  {
    "group": "District Executives",
    "position": "District President",
    "name": "Leo Lion Hansathi Imethma"
  },
  {
    "group": "District Executives",
    "position": "Immediate Past District President",
    "name": "Leo Lion Sunera Naveed"
  },
  {
    "group": "District Executives",
    "position": "District Vice President",
    "name": "Leo Lion Senura Battage"
  },
  {
    "group": "District Executives",
    "position": "District Secretary",
    "name": "Leo Vihara Jayaweera"
  },
  {
    "group": "District Executives",
    "position": "District Treasurer",
    "name": "Leo Lion Tehan Nakandala"
  },
  {
    "group": "District Executives",
    "position": "District Additional Secretary/ Membership Chairperson",
    "name": "Leo Indeera Weerasinghe"
  },
  {
    "group": "District Executives",
    "position": "District Additional Treasurer",
    "name": "Leo Minasha Katugampola"
  },
  {
    "group": "District Executives",
    "position": "District Assistant Secretary",
    "name": "Leo Lion Imesha Yohani"
  },
  {
    "group": "District Executives",
    "position": "District Assistant Treasurer",
    "name": "Leo Manthila Liyanage"
  },
  {
    "group": "District Executives",
    "position": "Leo Lion Liason Officer",
    "name": "Leo Lion Thavisha Bandara"
  },
  {
    "group": "District Executives",
    "position": "District Director - Special Programs",
    "name": "Leo Lion Manthila Gamage"
  },
  {
    "group": "District Executives",
    "position": "District Director - Education and Career Guidance",
    "name": "Leo Lion Poorna Panduwawala"
  },
  {
    "group": "District Executives",
    "position": "District Director - Operations",
    "name": "Leo Gevindu Kodikara"
  },
  {
    "group": "District Executives",
    "position": "District Director - Leadership & Professional Development",
    "name": "Leo Inod Perera"
  },
  {
    "group": "District Executives",
    "position": "District Director - Creative Operations",
    "name": "Leo Lion Didula Fonseka"
  },
  {
    "group": "Region Directors",
    "position": "Region Chairperson (Region 1)",
    "name": "Leo Nimsara Manith"
  },
  {
    "group": "Region Directors",
    "position": "Region Chaiperson (Region 2)",
    "name": "Leo Lion Gaveen Nayanjith"
  },
  {
    "group": "Region Directors",
    "position": "Region Chaiperson (Region 3)",
    "name": "Leo Thisaruni Wijebandara"
  },
  {
    "group": "Region Directors",
    "position": "Region Chaiperson (Region 4)",
    "name": "Leo Muthula Liyanage"
  },
  {
    "group": "Region Directors",
    "position": "Region Chairperson (Region 5)",
    "name": "Leo Ravinya Dimuth"
  },
  {
    "group": "Zone Directors",
    "position": "Zone Chairperson (Region 01 - Zone 01)",
    "name": "Leo Hiruna Rathnayaka"
  },
  {
    "group": "Zone Directors",
    "position": "Zone Chairperson (Region 01 - Zone 02)",
    "name": "Leo Hasanka Lakshan"
  },
  {
    "group": "Zone Directors",
    "position": "Zone Chairperson (Region 02 - Zone 01)",
    "name": "Leo Gaveen Perera"
  },
  {
    "group": "Zone Directors",
    "position": "Zone Chairperson (Region 02 - Zone 02)",
    "name": "Leo Rehan Thulnaka"
  },
  {
    "group": "Zone Directors",
    "position": "Zone Chairperson (Region 03 - Zone 01)",
    "name": "Leo Lithira Ramuditha"
  },
  {
    "group": "Zone Directors",
    "position": "Zone Chairperson (Region 03 - Zone 02)",
    "name": "Leo Lehara Silva"
  },
  {
    "group": "Zone Directors",
    "position": "Zone Chairperson (Region 04 - Zone 01)",
    "name": "Leo Vihas Santhula"
  },
  {
    "group": "Zone Directors",
    "position": "Zone Chairperson (Region 04 - Zone 02)",
    "name": "Leo Navindu Jayawardane"
  },
  {
    "group": "Zone Directors",
    "position": "Zone Chairperson (Region 05 - Zone 01)",
    "name": "Leo Udula Satharasinghe"
  },
  {
    "group": "Zone Directors",
    "position": "Zone Chairperson (Region 05 - Zone 02)",
    "name": "Leo Pamudi Anuththara"
  },
  {
    "group": "District Coordinators",
    "position": "District Chief Coordinator - Constitution & by laws",
    "name": "Leo Uvin Windula Wanigasekara"
  },
  {
    "group": "District Coordinators",
    "position": "District Chief Coordinator - Lions Global Challenges",
    "name": "Leo Kavindu Dehiwala"
  },
  {
    "group": "District Coordinators",
    "position": "District Chief Coordinator - Entertainment and Cultural Affairs",
    "name": "Leo Chirani Devanga"
  },
  {
    "group": "District Coordinators",
    "position": "District Chief Coordinator - Multiple District Affairs",
    "name": "Leo Akila Weragoda"
  },
  {
    "group": "Team Heads",
    "position": "District Team Head - Marketing & Digital Transformations Team",
    "name": "Leo Malindya Fernando"
  },
  {
    "group": "Team Heads",
    "position": "District Team Head - Administration",
    "name": "Leo Lion Shamindya Rupasinghe"
  },
  {
    "group": "Team Heads",
    "position": "District Team Head - Club Performance",
    "name": "Leo Janidu Induwara"
  },
  {
    "group": "Team Heads",
    "position": "District Team Head - Fundraising & Management",
    "name": "Leo Gayathri Kaushalya"
  },
  {
    "group": "Team Heads",
    "position": "District Team Head - Editorial ( Chief Bulletin Editor / Content Writing)",
    "name": "Leo Sineth Wickramaarachchi"
  },
  {
    "group": "Team Members",
    "position": "Marketing & Digital Transformations Team",
    "name": "Leo Lion Chiran Damsara"
  },
  {
    "group": "Team Members",
    "position": "Marketing & Digital Transformations Team",
    "name": "Leo Lion Thusal Ranawaka"
  },
  {
    "group": "Team Members",
    "position": "Marketing & Digital Transformations Team",
    "name": "Leo Sanduni Charundya"
  },
  {
    "group": "Team Members",
    "position": "Administration",
    "name": "Leo Malina Kalupahana"
  },
  {
    "group": "Team Members",
    "position": "Administration",
    "name": "Leo Thevindu Damsith"
  },
  {
    "group": "Team Members",
    "position": "Administration",
    "name": "Leo Sathsari Samaranayake"
  },
  {
    "group": "Team Members",
    "position": "Finance and Fundraising",
    "name": "Leo Chamod Vishwajith"
  },
  {
    "group": "Team Members",
    "position": "Finance and Fundraising",
    "name": "Leo Davindu Wickramasinghe"
  },
  {
    "group": "Team Members",
    "position": "Finance and Fundraising",
    "name": "Leo Damsath Chiranjeewa"
  },
  {
    "group": "Team Members",
    "position": "Editorial & Content Writing",
    "name": "Leo Nimasha Edirisooriya"
  },
  {
    "group": "Team Members",
    "position": "Editorial & Content Writing",
    "name": "Leo Sasira Vihanga"
  },
  {
    "group": "Team Members",
    "position": "Editorial & Content Writing",
    "name": "Leo Malki Madushika"
  },
  {
    "group": "Team Members",
    "position": "Club Performance",
    "name": "Leo Ravija Liyanage"
  },
  {
    "group": "Team Members",
    "position": "Club Performance",
    "name": "Leo Sanithu Kenula"
  },
  {
    "group": "Team Members",
    "position": "Club Performance",
    "name": "Leo Lion Anuk Nisalitha"
  }
];
