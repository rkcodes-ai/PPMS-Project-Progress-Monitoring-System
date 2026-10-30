"""
Catalog of 300 distinct academic projects across 15 computer science domains,
structured for Second Year (115 projects), Third Year (92 projects), and Fourth Year (93 projects).
Combined with the existing 25 projects, this yields exactly 325 projects (25 per section across all 13 sections).
"""

# Format: (title, description, problem_statement, category, ynum, sname)

CATALOG_PROJECTS = [
    # =========================================================================
    # SECOND YEAR — SECTION CSE-A (23 projects: slots 3 to 25)
    # =========================================================================
    (
        "Automated Lab Equipment Inventory & Barcode Scanner",
        "Web and mobile tracking tool for computer hardware components, monitor serials, and departmental lab checkouts.",
        "Manual ledger entry for lab hardware causes unrecorded equipment shortages and slow annual departmental audits.",
        "Database Systems", 2, "CSE-A"
    ),
    (
        "Student Digital Portfolio & Skill Matrix Generator",
        "Platform allowing undergraduates to compile verified course projects, coding badges, and generate industry-ready resumes.",
        "Students lack a centralized system to showcase coursework deliverables and skill credentials to potential recruiters.",
        "Web Application Development", 2, "CSE-A"
    ),
    (
        "Campus Lost and Found Portal with Image Matching",
        "A portal with feature-based image comparison helping students recover lost student IDs, calculators, and electronics.",
        "Physical notice boards and informal WhatsApp groups result in high unclaimed property rates across campus.",
        "Computer Vision", 2, "CSE-A"
    ),
    (
        "Hostel Room Allocation and Maintenance Grievance Tracker",
        "Automated hostel room allotment workflow based on GPA and distance, coupled with technician dispatch ticketing.",
        "Manual room allotment causes long student queues, and paper maintenance slips lead to unresolved electrical/plumbing complaints.",
        "Enterprise Web", 2, "CSE-A"
    ),
    (
        "Cafeteria Food Waste Tracking and Surplus Redistribution",
        "Weight-sensor telemetry and distribution scheduling to divert excess hostel meals to local community shelters.",
        "Excess campus canteen food is discarded daily while nearby charitable shelters lack real-time donation notifications.",
        "Environmental Sustainability", 2, "CSE-A"
    ),
    (
        "Digital Noticeboard with Targeted Push Notifications",
        "Centralized departmental announcements board categorized by semester, section, and urgent academic deadlines.",
        "Important circulars buried in mass emails lead to missed scholarship deadlines and examination schedule confusion.",
        "Mobile Computing", 2, "CSE-A"
    ),
    (
        "Automated Quiz Engine with Plagiarism Detection",
        "Timed coding and conceptual quiz platform that flags identical code snippets and browser tab switching during testing.",
        "Online assessment validity is compromised by unauthorized collusion and lack of automated anti-cheating mechanisms.",
        "Education Technology", 2, "CSE-A"
    ),
    (
        "Campus Shuttle Bus Seat Occupancy Monitor",
        "Infrared tripwire passenger counters transmitting live seat availability to student mobile applications.",
        "Students wait at bus stops without knowing whether incoming campus shuttles have available seating.",
        "Internet of Things", 2, "CSE-A"
    ),
    (
        "Alumni Mentorship and Career Guidance Network",
        "Networking and scheduling platform connecting second-year undergraduates with alumni working in target tech industries.",
        "Students lack structured access to alumni who can offer career guidance, resume reviews, and internship referrals.",
        "Web Application Development", 2, "CSE-A"
    ),
    (
        "Department Paperless Assignment Submission & Grading Portal",
        "Cloud-based assignment submission engine supporting PDF annotations, inline rubrics, and automated grade tallying.",
        "Paper submissions generate departmental clutter, slow grading turnarounds, and lack traceable revision history.",
        "Education Technology", 2, "CSE-A"
    ),
    (
        "Classroom Ambient Noise and Acoustic Level Analyzer",
        "Microcontroller node monitoring decibel levels in departmental lecture halls to optimize acoustic intelligibility.",
        "High acoustic reverberation and ambient chatter in large lecture halls impair student lecture comprehension.",
        "IoT & Embedded", 2, "CSE-A"
    ),
    (
        "Interactive Campus 3D Map and Navigation System",
        "WebGL-based indoor and outdoor campus navigation tool guiding freshmen and visitors to lecture halls and labs.",
        "New students and campus visitors struggle to navigate sprawling departmental blocks and multi-story lab buildings.",
        "Web Application Development", 2, "CSE-A"
    ),
    (
        "Peer-to-Peer Study Group Matching Application",
        "Collaborative matching engine grouping students based on weak conceptual areas, free timetable slots, and target courses.",
        "Students struggling with difficult subjects find it challenging to self-organize productive study peer groups.",
        "Data Analytics", 2, "CSE-A"
    ),
    (
        "Blood Donation Camp Registration and Donor Emergency Registry",
        "Emergency blood group search engine connecting college youth Red Cross volunteers with local hospitals.",
        "Critical delays occur when emergency blood requests cannot rapidly identify compatible donors on campus.",
        "Healthcare Technology", 2, "CSE-A"
    ),
    (
        "Electricity Meter Sub-Billing System for Campus Labs",
        "Digital monitoring dashboard tracking power consumption of individual computer labs and recommending energy savings.",
        "Departmental facilities lack granular per-lab electricity data to identify idle workstations left powered overnight.",
        "Environmental Sustainability", 2, "CSE-A"
    ),
    (
        "Automated Question Paper Generator from Bloom's Taxonomy",
        "Curriculum-aligned test generator that balances question difficulty levels, course outcomes, and module coverage.",
        "Faculty spend extensive manual hours assembling balanced midterm question papers aligned with accreditation criteria.",
        "Education Technology", 2, "CSE-A"
    ),
    (
        "Student Micro-Savings and Expense Budgeting Mobile App",
        "Personal finance tracker tailored for college hostellers with daily food allowance caps and alert thresholds.",
        "Undergraduate hostellers frequently experience month-end budget exhaustion due to unmonitored impulse spending.",
        "Mobile Computing", 2, "CSE-A"
    ),
    (
        "Faculty Office Hours Booking and Queue Manager",
        "Digital scheduling tool allowing students to reserve 10-minute 1-on-1 slots, reducing hallway congestion outside faculty cabins.",
        "Students crowd outside faculty offices during exam weeks without knowing faculty availability or meeting queues.",
        "Web Application Development", 2, "CSE-A"
    ),
    (
        "Sports Facility Court Booking and Equipment Checkout System",
        "Real-time reservation system for college badminton/tennis courts and sports equipment inventory management.",
        "Double-booked sports courts and unreturned sports gear cause student conflicts and equipment losses.",
        "Enterprise Web", 2, "CSE-A"
    ),
    (
        "Campus Tree Plantation and Carbon Offset Tracker",
        "Geotagged tree census app tracking sapling survival rates, species biodiversity, and estimated campus carbon sequestration.",
        "Campus greening initiatives lack quantitative tracking of sapling survival and longitudinal ecological impact.",
        "Environmental Sustainability", 2, "CSE-A"
    ),
    (
        "Student Hackathon Registration and Team Formation Platform",
        "Portal facilitating hackathon registrations, skillset matching (frontend, backend, design), and project idea pitch deck uploads.",
        "Solo applicants struggle to assemble balanced interdisciplinary teams for national hackathons and project expos.",
        "Web Application Development", 2, "CSE-A"
    ),
    (
        "Local Bus Route Optimization for Day Scholar Commuters",
        "Survey data analytics engine analyzing student postal pins to suggest optimal private bus pickup points.",
        "Suboptimal college bus routing leads to extended daily transit times of over two hours for suburban day scholars.",
        "Data Analytics", 2, "CSE-A"
    ),
    (
        "Laboratory Software License Expiry and Compliance Tracker",
        "Audit tool scanning departmental lab server licenses and generating alert reminders 30 days before renewal deadlines.",
        "Unmonitored commercial software license lapses cause sudden disruptions during scheduled practical laboratory exams.",
        "Cybersecurity & IT Admin", 2, "CSE-A"
    ),

    # =========================================================================
    # SECOND YEAR — SECTION CSE-B (23 projects: slots 3 to 25)
    # =========================================================================
    (
        "Interactive Data Structures Visualization Toolkit",
        "Web-based algorithm animation tool visually demonstrating AVL trees, Dijkstra's algorithm, and graph traversals.",
        "Abstract pointer operations and algorithmic recursion remain difficult for second-year students to grasp from static slides.",
        "Education Technology", 2, "CSE-B"
    ),
    (
        "Automated Daily Timetable Clash Resolver",
        "Constraint satisfaction solver generating faculty and room allocation schedules without room or instructor collisions.",
        "Manual timetable drafting across elective batches requires multiple revision cycles to resolve room clashes.",
        "Algorithms & Optimization", 2, "CSE-B"
    ),
    (
        "Campus Bookstore Peer-to-Peer Secondhand Textbook Exchange",
        "Student marketplace for buying and selling approved engineering textbooks, lab manuals, and scientific calculators.",
        "Junior students incur high textbook expenses each semester while seniors discard identical physical books upon graduation.",
        "Web Application Development", 2, "CSE-B"
    ),
    (
        "Student Club Membership and Event Ticketing System",
        "Management tool for university technical and cultural societies to track member attendance and issue QR entry tickets.",
        "Clubs maintain fragmented spreadsheets leading to duplicate ticket issues and inaccurate student participation records.",
        "Enterprise Web", 2, "CSE-B"
    ),
    (
        "College Stationary & Print Queue Management System",
        "Digital print spooler allowing students to upload lab records for printing and collect them without waiting in queues.",
        "Stationary shops experience severe crowding before morning lab sessions as students wait for physical record prints.",
        "Web Application Development", 2, "CSE-B"
    ),
    (
        "Water Quality Monitoring in Campus RO Purification Plants",
        "TDS and pH sensor telemetry broadcasting real-time drinking water safety ratings to student hostel dashboards.",
        "Students express health concerns regarding hostel drinking water without access to verified filter telemetry data.",
        "Internet of Things", 2, "CSE-B"
    ),
    (
        "Department Seminar Hall Audio-Visual Booking Portal",
        "Reservation system for projectors, wireless microphones, and auditorium seating for technical guest lectures.",
        "Conflicting departmental seminar bookings lead to equipment shortages and delayed guest speaker presentations.",
        "Enterprise Web", 2, "CSE-B"
    ),
    (
        "Automated Resume Bullet Point Generator for Engineering Freshers",
        "Structured drafting assistant guiding students to format technical project achievements using action verbs and metrics.",
        "Students struggle to articulate academic course projects effectively for first-round technical resume screening.",
        "Web Application Development", 2, "CSE-B"
    ),
    (
        "Canteen Pre-Order and Token Generation Mobile Application",
        "Order-ahead canteen app allowing students to pay digitally and pick up meals during short 15-minute class breaks.",
        "Severe lunch rush queues cause students to skip meals or arrive late to afternoon laboratory sessions.",
        "Mobile Computing", 2, "CSE-B"
    ),
    (
        "Digital Student Identity Card with Encrypted QR Verification",
        "Cryptographically signed digital student ID pass verifiable by security staff even when offline.",
        "Lost physical ID cards compromise campus perimeter security and cause administrative replacement delays.",
        "Cybersecurity", 2, "CSE-B"
    ),
    (
        "Campus Vehicle Parking Space Availability Sensor",
        "Ultrasonic parking bay nodes transmitting occupied/vacant bay counts to digital entrance display boards.",
        "Two-wheeler and four-wheeler parking lots experience chaotic circling during peak 8:30 AM arrival hours.",
        "Internet of Things", 2, "CSE-B"
    ),
    (
        "Faculty Leave Management and Substitute Allocation Portal",
        "Workforce portal enabling faculty to request academic leaves and automatically suggest peer substitution for scheduled classes.",
        "Unplanned faculty leaves lead to unattended classrooms when substitute coverage is not coordinated in advance.",
        "Enterprise Web", 2, "CSE-B"
    ),
    (
        "Student Fitness & Gym Equipment Usage Tracker",
        "Check-in logger for university gym facilities monitoring equipment wear, peak usage hours, and student workout frequency.",
        "University gymnasium facilities face overcrowding during evening hours without data on equipment availability.",
        "Healthcare Technology", 2, "CSE-B"
    ),
    (
        "Automated Course Outcome (CO) - Program Outcome (PO) Attainment Calculator",
        "Accreditation computation tool deriving quantitative CO-PO attainment matrices from internal assessment marksheets.",
        "Faculty spend weeks manually calculating NBA accreditation attainment sheets using complex multi-sheet Excel files.",
        "Data Analytics", 2, "CSE-B"
    ),
    (
        "Hostel Electricity Conservation Gamification Portal",
        "Inter-hostel wing energy savings leaderboard awarding green points to floors that reduce peak kilowatt consumption.",
        "Hostel residents lack personal incentive to turn off ceiling fans and computer monitors when leaving dormitories.",
        "Environmental Sustainability", 2, "CSE-B"
    ),
    (
        "Campus Medical Clinic Patient Visit and Medicine Stock Log",
        "Dispensary management application tracking student outpatient visits, prescribed medicines, and pharmaceutical reorder levels.",
        "The campus health clinic relies on paper logs, leading to unnoticed stockouts of essential anti-allergy and emergency medicines.",
        "Healthcare Technology", 2, "CSE-B"
    ),
    (
        "Virtual Chemistry Lab Molecular Simulation for Engineering First-Years",
        "Interactive browser 3D titration and molecular structure simulator allowing preparatory experiment rehearsals.",
        "Students enter physical chemistry labs without prior visualization of titration endpoints and chemical handling safety.",
        "Education Technology", 2, "CSE-B"
    ),
    (
        "Automated Student Bonafide Certificate Issuance Portal",
        "Self-service portal generating digitally signed bonafide and fee structure certificates for passport and bank loan applications.",
        "Students wait days for manual administrative verification and Dean signatures for routine bonafide requests.",
        "Enterprise Web", 2, "CSE-B"
    ),
    (
        "Campus Streetlight Fault Detection Using LDR Telemetry",
        "Automated sensor node network notifying maintenance teams when streetlight fixtures fail to ignite after dusk.",
        "Dark pedestrian paths across campus remain unreported for days, creating safety concerns for late-night lab commuters.",
        "Internet of Things", 2, "CSE-B"
    ),
    (
        "Student Code Repository Sandbox with Auto-Testing",
        "Docker-isolated grading sandbox running student C/C++ and Python lab submissions against hidden unit test suites.",
        "Manual lab evaluation by teaching assistants is subjective and cannot exhaustively test edge cases in student code.",
        "Education Technology", 2, "CSE-B"
    ),
    (
        "Campus Rainwater Harvesting Tank Level and Usage Dashboard",
        "Ultrasonic telemetry monitoring underground rainwater reservoirs to optimize campus garden sprinkler scheduling.",
        "Rainwater storage tanks overflow during monsoon downpours while municipal water is purchased needlessly during dry spells.",
        "Environmental Sustainability", 2, "CSE-B"
    ),
    (
        "Student Internship Review and Interview Experience Archive",
        "Peer-reviewed database where senior students document interview rounds, technical questions, and company culture.",
        "Valuable campus recruitment interview learnings are lost annually when graduating seniors depart without documenting questions.",
        "Web Application Development", 2, "CSE-B"
    ),
    (
        "Departmental Newsletter and Research Publication Digest",
        "Digital content publishing engine compiling monthly faculty paper acceptances, student awards, and patent filings.",
        "Departmental research accomplishments remain siloed and unpublicized to the wider student and industrial community.",
        "Web Application Development", 2, "CSE-B"
    ),

    # =========================================================================
    # SECOND YEAR — SECTION CSE-C (23 projects: slots 3 to 25)
    # =========================================================================
    (
        "Disaster Evacuation Drill Path Simulator",
        "A 2D layout routing tool determining optimal building exit pathways based on stairwell capacities and simulated smoke spread.",
        "Campus emergency drills follow arbitrary exit paths without analytical validation of stairwell choke points.",
        "Disaster Management", 2, "CSE-C"
    ),
    (
        "Multilingual Campus Visitor Voice Assistant",
        "Interactive voice kiosk supporting Hindi, Tamil, Telugu, and English to guide non-English speaking parents across campus.",
        "Visiting parents frequently encounter language barriers when attempting to locate administrative offices and hostels.",
        "Accessibility & Social Impact", 2, "CSE-C"
    ),
    (
        "Automated Soil Nutrient & Moisture Telemetry for College Gardens",
        "IoT sensor probes measuring NPK balance and moisture in campus botanical gardens to automate drip valves.",
        "Campus botanical specimens suffer from overwatering and nutrient deficiency due to unmonitored hose irrigation.",
        "Agriculture Technology", 2, "CSE-C"
    ),
    (
        "Student Mood Journaling with Sentiment Trend Analytics",
        "Private wellness application helping students log daily stress levels and highlighting positive coping habits.",
        "Academic stress before midterm examinations often goes unnoticed until acute psychological burnout occurs.",
        "Healthcare Technology", 2, "CSE-C"
    ),
    (
        "Secure Online Voting System for Student Council Elections",
        "Cryptographically verifiable ballot system allowing eligible students to vote securely using college email OTP verification.",
        "Paper ballot voting for student body elections is vulnerable to tallying disputes, duplicate votes, and slow counting.",
        "Cybersecurity", 2, "CSE-C"
    ),
    (
        "Solar Panel Dust Accumulation & Output Efficiency Monitor",
        "Photoelectric comparison system alerting maintenance staff when rooftop solar panels require washing to restore efficiency.",
        "Dust accumulation on campus rooftop photovoltaic arrays degrades electrical power output by up to 28% undetected.",
        "Environmental Sustainability", 2, "CSE-C"
    ),
    (
        "Dynamic Exam Seating Arrangement & Hall Ticket Generator",
        "Algorithmic seating generator that intersperses students from different departments to eliminate exam room copying.",
        "Manual exam hall seating charts take days to prepare and frequently place adjacent classmates together.",
        "Enterprise Web", 2, "CSE-C"
    ),
    (
        "Accessible Audio-Description Assistant for Visually Impaired Students",
        "Screen and textbook OCR assistant converting printed lab manuals into structured audio speech with bookmarking.",
        "Visually challenged engineering students encounter severe friction reading printed laboratory procedure manuals.",
        "Accessibility & Social Impact", 2, "CSE-C"
    ),
    (
        "Automated Syllabus Coverage and Lecture Log Tracker",
        "Faculty syllabus tracking tool comparing scheduled lecture hours against university curriculum milestones.",
        "Discrepancies in course syllabus completion lead to rushed lectures right before semester-end examinations.",
        "Education Technology", 2, "CSE-C"
    ),
    (
        "Campus Bicycle Sharing & Geofenced Lock Management",
        "QR-unlocked green campus bicycle fleet with GPS geofencing to promote carbon-neutral student commuting.",
        "Walking between distant hostel blocks and engineering labs causes tardiness, yet personal bikes cause cluttered entryways.",
        "Environmental Sustainability", 2, "CSE-C"
    ),
    (
        "College Bus Break-Down Emergency Dispatch System",
        "Driver SOS beacon broadcasting instant breakdown coordinates to college transport coordinators to dispatch backup buses.",
        "Morning college bus breakdowns leave hundreds of students stranded without timely dispatch of relief transport.",
        "Disaster Management", 2, "CSE-C"
    ),
    (
        "Smart Classroom Energy Manager with Occupancy Sensors",
        "PIR sensor relays switching off air conditioners and projector systems automatically when classrooms remain empty for 10 minutes.",
        "Classroom lights and projectors frequently stay energized throughout weekends in unoccupied departmental halls.",
        "Internet of Things", 2, "CSE-C"
    ),
    (
        "Student Mini-Project Repository with Searchable Code Index",
        "Searchable code index categorizing second-year mini-projects by tech stack, APIs used, and demonstration videos.",
        "Junior students struggle to find prior project references and inadvertently propose duplicate project ideas.",
        "Database Systems", 2, "CSE-C"
    ),
    (
        "College Day Scholar Ride-Pooling Coordination Platform",
        "Security-verified carpooling and two-wheeler ride-sharing app connecting students commuting along identical routes.",
        "Traffic congestion outside campus gates and single-occupancy vehicle emissions increase daily commuter carbon footprints.",
        "Environmental Sustainability", 2, "CSE-C"
    ),
    (
        "Automated Departmental Equipment Calibration Schedule Logger",
        "Compliance database tracking calibration dates for oscilloscopes, multimeters, and networking routers in hardware labs.",
        "Uncalibrated electronic lab instruments lead to inaccurate student experimental measurements and failed lab viva results.",
        "Database Systems", 2, "CSE-C"
    ),
    (
        "Student Mental Math & Aptitude Practice Platform",
        "Gamified aptitude drill application with speed leaderboards to prepare students for third-year placement assessments.",
        "Students defer quantitative aptitude training until final year, resulting in high rejection rates during initial placement rounds.",
        "Education Technology", 2, "CSE-C"
    ),
    (
        "Campus Food Delivery Aggregator for Late-Night Hostellers",
        "Controlled ordering platform connecting hostel gates with approved neighborhood hygienic night eateries.",
        "Hostel residents ordering from unverified night eateries face food hygiene risks and security gate delivery disputes.",
        "Web Application Development", 2, "CSE-C"
    ),
    (
        "Elderly Faculty Ergonomic Posture Assistant",
        "Webcam-based posture reminder alerting faculty members when prolonged screen desk sessions exceed ergonomic limits.",
        "Prolonged sedentary screen grading leads to chronic cervical strain and repetitive strain injuries among faculty.",
        "Healthcare Technology", 2, "CSE-C"
    ),
    (
        "Campus Fire Extinguisher Inspection and Expiry Logger",
        "NFC-scanned inspection logger recording pressure gauge levels and scheduled refill dates for campus fire safety cylinders.",
        "Expired fire extinguishers in engineering laboratories pose catastrophic safety hazards during electrical fires.",
        "Disaster Management", 2, "CSE-C"
    ),
    (
        "Automated Course Feedback Summarizer with Lexicon Analysis",
        "Anonymous course end-survey analyzer categorizing student feedback comments into actionable instructional improvements.",
        "Faculty receive hundreds of free-text student survey responses but lack tools to synthesize recurring constructive points.",
        "Data Analytics", 2, "CSE-C"
    ),
    (
        "Student Sports Tournament Bracket and Live Scoreboard",
        "Digital bracket organizer managing inter-department cricket and football leagues with real-time score updates.",
        "Sports tournament schedules on paper notices lead to forfeit disputes and confused spectator attendance.",
        "Web Application Development", 2, "CSE-C"
    ),
    (
        "Departmental Faculty Publication Citation Counter",
        "Automated scraper updating faculty Google Scholar citations, h-indexes, and journal impact factor records monthly.",
        "Faculty appraisal dossiers require tedious manual compilation of publication citation counts and journal metrics.",
        "Data Analytics", 2, "CSE-C"
    ),
    (
        "Campus Pet & Animal Rescue Registry",
        "Community reporting tool connecting students and veterinary volunteers to treat and vaccinate community dogs on campus.",
        "Injured community animals on large educational campuses often go unnoticed without a structured reporting channel.",
        "Accessibility & Social Impact", 2, "CSE-C"
    ),

    # =========================================================================
    # SECOND YEAR — SECTION CSE-D (23 projects: slots 3 to 25)
    # =========================================================================
    (
        "Campus Tree Leaf Specimen Classifier for Botany Electives",
        "Mobile classification model identifying campus plant species and detailing their medicinal and botanical characteristics.",
        "Interdisciplinary students taking environmental science electives struggle to identify campus floral biodiversity.",
        "Computer Vision", 2, "CSE-D"
    ),
    (
        "Automated Hall Ticket Barcode Scanner for Exam Attendance",
        "Android-based barcode scanner validating student hall tickets and transmitting instantaneous room attendance to exam cell.",
        "Manual exam attendance signatures on paper sheets require hours of post-exam data entry and reconciliation.",
        "Mobile Computing", 2, "CSE-D"
    ),
    (
        "Personal Health Record Vault with Emergency ICE QR Code",
        "Encrypted medical wallet generating lock-screen emergency QR stickers detailing blood group, allergies, and emergency contacts.",
        "First responders treating collapsed students during sports events cannot immediately access critical allergy or blood type data.",
        "Healthcare Technology", 2, "CSE-D"
    ),
    (
        "Automated Lab Computer Health and Hard Drive S.M.A.R.T. Monitor",
        "Background daemon scanning lab workstation hard drives and alerting system administrators prior to disk failure.",
        "Workstation hard drive crashes during practical lab exams result in catastrophic loss of unsubmitted student code.",
        "Cloud & Distributed Systems", 2, "CSE-D"
    ),
    (
        "Smart Classroom Projector Bulb Life and Temperature Logger",
        "Thermal probe attached to classroom multimedia projectors alerting technicians when cooling fan filters need cleaning.",
        "Overheating projector bulbs burst prematurely during lectures, incurring avoidable departmental replacement expenses.",
        "Internet of Things", 2, "CSE-D"
    ),
    (
        "College Event Live Audio Streaming for Remote Attendees",
        "Low-latency WebRTC audio streaming server broadcasting departmental symposiums to alumni and remote students.",
        "Students unable to attend auditorium guest lectures in person have no reliable live audio feed of speaker keynotes.",
        "Networking", 2, "CSE-D"
    ),
    (
        "Automated Lab Seating Generator with Peer Balancing",
        "Seating algorithm distributing advanced and struggling programmers as lab partners to foster collaborative learning.",
        "Self-selected lab seating results in isolated struggling students and prevents peer knowledge transfer.",
        "Education Technology", 2, "CSE-D"
    ),
    (
        "Campus Green House Micro-Climate Controller",
        "Microcontroller governing humidity misters and exhaust fans based on greenhouse temperature sensor thresholds.",
        "Experimental agricultural plant specimens in college poly-houses perish due to unchecked temperature spikes.",
        "Agriculture Technology", 2, "CSE-D"
    ),
    (
        "Anonymous Peer Bullying and Ragging Reporting Portal",
        "Encrypted whistleblowing channel with zero-knowledge metadata stripping enabling safe reporting of campus harassment.",
        "Victims of junior harassment hesitate to report incidents in person due to fear of retaliation and social stigma.",
        "Cybersecurity", 2, "CSE-D"
    ),
    (
        "College Mess Food Menu Nutrition and Calorie Calculator",
        "Web tool detailing daily mess food nutrient composition and recommending balanced portion sizes for active students.",
        "Students with dietary restrictions or fitness goals have no visibility into the macronutrient content of dining hall meals.",
        "Healthcare Technology", 2, "CSE-D"
    ),
    (
        "Interactive Operating System Scheduling Simulator",
        "Visual simulation workbench comparing Round Robin, SJF, and Priority CPU scheduling algorithms with timeline graphs.",
        "Second-year students struggle to compute turnaround times and visualize process starvation from textbook formulas.",
        "Education Technology", 2, "CSE-D"
    ),
    (
        "Automated Certificate Generator with PDF Digital Signatures",
        "Bulk certificate dispatch engine generating personalized PDF symposium credentials with cryptographically verifiable signatures.",
        "Organizing committees spend days manually typing student names onto generic certificate templates.",
        "Enterprise Web", 2, "CSE-D"
    ),
    (
        "Campus E-Waste Disposal and Refurbishment Coordinator",
        "Inventory logging obsolete computer peripherals, testing salvageable RAM/cables, and routing e-waste to certified recyclers.",
        "Discarded computer mice, keyboards, and circuit boards accumulate in lab storerooms without systematic recycling.",
        "Environmental Sustainability", 2, "CSE-D"
    ),
    (
        "Automated College Bus Fuel Consumption Anomaly Detector",
        "Telemetry ingestion engine flagging sudden fuel drops and abnormal liter-per-kilometer deviations in institutional buses.",
        "Undetected fuel siphoning and engine degradation lead to inflated departmental transport operating budgets.",
        "Data Analytics", 2, "CSE-D"
    ),
    (
        "Hostel Wi-Fi Signal Heatmap and Dead-Zone Mapper",
        "Crowdsourced student mobile signal logger plotting Wi-Fi dead zones across hostel corridors to guide router placement.",
        "Hostel residents suffer from dropped internet connections due to arbitrary router installations without signal surveys.",
        "Networking", 2, "CSE-D"
    ),
    (
        "Student Skill Endorsement and Micro-Credential Badging",
        "Departmental badge ledger issuing verifiable digital badges for Git mastery, Linux CLI proficiency, and SQL competence.",
        "Standard grade sheets fail to convey granular hands-on tool competencies to prospective internship hiring managers.",
        "Education Technology", 2, "CSE-D"
    ),
    (
        "Campus Water Leakage Detection Using Flow Rate Differential",
        "Dual-flow meter IoT pipeline detecting underground pipeline bursts by comparing main supply volume with building intake.",
        "Underground pipeline ruptures on campus remain undetected for weeks, squandering thousands of liters of treated water.",
        "Internet of Things", 2, "CSE-D"
    ),
    (
        "Department Alumni Donation and Scholarship Fund Dashboard",
        "Transparent fund accounting portal showcasing alumni-sponsored student scholarships and lab equipment upgrades.",
        "Alumni hesitate to contribute financial donations without public visibility into fund disbursement and student impact.",
        "Enterprise Web", 2, "CSE-D"
    ),
    (
        "Interactive Computer Architecture Logic Gate Circuit Builder",
        "Web-based schematic simulator allowing students to interconnect multiplexers, flip-flops, and ALUs with instant logic probes.",
        "Hardware lab kits are limited in number, preventing students from testing complex logic circuits outside scheduled lab hours.",
        "Education Technology", 2, "CSE-D"
    ),
    (
        "Student Daily Commute Carbon Footprint Calculator",
        "Mobile tracker estimating personal weekly commuter emissions and rewarding bus and train travelers with campus green tokens.",
        "Day scholars lack awareness of their transport carbon footprint and how mass transit commuting combats climate change.",
        "Environmental Sustainability", 2, "CSE-D"
    ),
    (
        "Departmental Thesis and Project Report PDF Format Validator",
        "Automated document checker verifying IEEE font sizes, margin widths, reference numbering, and figure caption standards.",
        "Project coordinators spend countless hours rejecting student reports due to non-compliant margins and bibliography styles.",
        "Education Technology", 2, "CSE-D"
    ),
    (
        "Campus First-Aid Kit Replenishment Reminder System",
        "NFC-based medical box audit tool notifying department administrators when bandages, antiseptics, and burn creams expire.",
        "Emergency first-aid boxes in engineering workshops are frequently found empty or stocked with expired medical ointments.",
        "Healthcare Technology", 2, "CSE-D"
    ),
    (
        "Student Coding Interview Flashcard Platform",
        "Spaced repetition web application training students on core data structure complexities and algorithmic trade-offs.",
        "Students cram algorithms before interviews without retaining the space-time complexities required during technical rounds.",
        "Education Technology", 2, "CSE-D"
    ),

    # =========================================================================
    # SECOND YEAR — SECTION CSE-E (23 projects: slots 3 to 25)
    # =========================================================================
    (
        "Smart Classroom Indoor Air Quality & CO2 Monitor",
        "NDIR sensor array tracking carbon dioxide accumulation and sounding gentle ventilation reminders to prevent drowsiness.",
        "Elevated CO2 concentrations in closed air-conditioned seminar halls lead to documented cognitive fatigue and student lethargy.",
        "Internet of Things", 2, "CSE-E"
    ),
    (
        "Departmental Guest House Booking and Hospitality Portal",
        "Reservation portal managing VIP guest rooms, dining preferences, and billing for visiting university accreditation panels.",
        "Guest house double-bookings and uncoordinated catering for visiting accreditation evaluators cause administrative embarrassment.",
        "Enterprise Web", 2, "CSE-E"
    ),
    (
        "Automated Student Identity Card Photo Cropper & Normalizer",
        "Face-centering image processor resizing and standardizing incoming freshman portrait uploads for identity card printing.",
        "Admissions staff manually crop and resize thousands of student passport photos with inconsistent aspect ratios.",
        "Computer Vision", 2, "CSE-E"
    ),
    (
        "Campus Security Guard Patrolling Verification via QR Checkpoints",
        "Mobile patrol logger requiring security personnel to scan geofenced QR codes along perimeter boundaries every hour.",
        "Perimeter security vulnerabilities occur when scheduled night guard patrols are skipped without supervisor visibility.",
        "Mobile Computing", 2, "CSE-E"
    ),
    (
        "Student Railway Concession Ticket Request and Verification Portal",
        "Online document submission tool allowing students to request government railway transit pass vouchers without administrative queues.",
        "Students miss class hours standing in administrative lines to submit printed railway concession request vouchers.",
        "Enterprise Web", 2, "CSE-E"
    ),
    (
        "Campus Solar Water Heater Temperature and Usage Telemetry",
        "Thermal probe telemetry logging hot water availability across hostel shower blocks during winter morning peak hours.",
        "Hostel solar heating water runs cold during cloudy mornings without automated auxiliary boiler backup triggering.",
        "Internet of Things", 2, "CSE-E"
    ),
    (
        "Automated Department Lab Component Checkout Kiosk",
        "Self-service touchscreen checkout unit scanning student RFID cards and logging borrowed Arduino/Raspberry Pi boards.",
        "Lab instructors lose component checkout slips, leading to unreturned microcontrollers and kit component shortages.",
        "Database Systems", 2, "CSE-E"
    ),
    (
        "Undergraduate Research Opportunity Portal (UROP)",
        "Matching platform listing funded faculty research assistantships and letting motivated second-years apply with resumes.",
        "Undergraduates lack a structured avenue to discover faculty research vacancies, missing valuable early research exposure.",
        "Web Application Development", 2, "CSE-E"
    ),
    (
        "Hostel Laundry Slot Booking and Machine Status Indicator",
        "IoT vibration monitor indicating active washing machine cycles and letting students reserve 45-minute laundry slots.",
        "Students carry heavy laundry buckets to hostel basements only to find all washing machines occupied or broken.",
        "Mobile Computing", 2, "CSE-E"
    ),
    (
        "Automated College Letterhead Document Formatter",
        "Departmental template engine generating official memorandums and recommendation letters with authentic crest formatting.",
        "Faculty draft official recommendation letters with inconsistent margins, outdated college addresses, and broken logos.",
        "Enterprise Web", 2, "CSE-E"
    ),
    (
        "Interactive Regular Expression Learning and Visualizer Tool",
        "Interactive regex sandbox explaining finite automata state transitions and highlight matching substrings in real-time.",
        "Theoretical automata regex concepts are perceived as difficult without interactive step-by-step state matching visualizations.",
        "Education Technology", 2, "CSE-E"
    ),
    (
        "Campus Cafeteria Food Calorie Estimator from Menu Photos",
        "Lightweight computer vision model identifying traditional canteen breakfast items and estimating caloric intake.",
        "Students seeking healthier diets have difficulty assessing nutritional value and oil content in daily canteen meals.",
        "Healthcare Technology", 2, "CSE-E"
    ),
    (
        "Student Micro-Internship Project Marketplace",
        "Internal project exchange connecting student freelance developers with campus administrative departments needing small tools.",
        "Campus departments outsource small software tasks while talented computer science students seek paid portfolio projects.",
        "Web Application Development", 2, "CSE-E"
    ),
    (
        "Laboratory Voltage Fluctuation and Spike Protector Log",
        "Mains telemetry module recording voltage brownouts and triggering controlled shutdowns of sensitive lab servers.",
        "Unmonitored grid voltage spikes blow power supplies in computer labs and disrupt scheduled software practical sessions.",
        "Internet of Things", 2, "CSE-E"
    ),
    (
        "Interactive SQL Query Execution Plan Visualizer",
        "Educational web tool translating raw EXPLAIN outputs into interactive graphical query cost trees with index recommendations.",
        "Students struggle to understand query optimization concepts when looking at complex textual SQL execution plan tables.",
        "Database Systems", 2, "CSE-E"
    ),
    (
        "Campus Sound Pollution Monitoring and Siren Alert",
        "Acoustic node network warning drivers and campus vehicle operators who honk in designated academic quiet zones.",
        "Excessive vehicle honking along campus ring roads disrupts ongoing lectures and library study environments.",
        "Environmental Sustainability", 2, "CSE-E"
    ),
    (
        "Department Alumni Mentorship Appointment Scheduler",
        "Integrated calendar booking tool syncing alumni availability in US/European time zones with Indian student academic hours.",
        "Time zone confusion leads to missed mentorship calls between international alumni and aspiring undergraduate mentees.",
        "Web Application Development", 2, "CSE-E"
    ),
    (
        "Student Exam Seating SMS Dispatch Service",
        "SMS notification gateway dispatching room number and seat row coordinates to student phones 60 minutes prior to exam start.",
        "Crowds of hundreds of anxious students congregate around exam hall bulletin boards searching for seat numbers.",
        "Enterprise Web", 2, "CSE-E"
    ),
    (
        "Accessible Campus Colorblindness Contrast Testing Extension",
        "Browser extension validating college websites against WCAG contrast standards for deuteranopia and protanopia users.",
        "Departmental websites frequently use poor color contrasts that render course notices illegible to colorblind students.",
        "Accessibility & Social Impact", 2, "CSE-E"
    ),
    (
        "College Library Book Return Drop-Box RFID Automator",
        "Automated return bin that instantly reads RFID book tags, updates student accounts, and issues digital return receipts.",
        "Book return desks experience long queues during end-of-semester clearance, causing students to incur overdue book fines.",
        "Database Systems", 2, "CSE-E"
    ),
    (
        "Student Coding Bug Tracker and Debugging Log",
        "Personal developer journal where second-year programmers record recurring syntax errors and document resolving techniques.",
        "Novice programmers repeatedly spend hours solving identical compiler errors that they previously resolved without notes.",
        "Education Technology", 2, "CSE-E"
    ),
    (
        "Campus Weather Station with Micro-Forecast for Sports Day",
        "Local telemetry logging barometric pressure, rain gauge readings, and wind speeds to forecast localized afternoon showers.",
        "Campus athletic meets and outdoor cultural festivals face sudden disruptions from unpredicted localized downpours.",
        "Internet of Things", 2, "CSE-E"
    ),
    (
        "Departmental Thesis Anti-Plagiarism Pre-Check Utility",
        "Local n-gram matching engine scanning draft student project synopses against prior years' departmental project archives.",
        "Students inadvertently submit project ideas and documentation passages highly similar to prior year departmental theses.",
        "Education Technology", 2, "CSE-E"
    ),

    # =========================================================================
    # THIRD YEAR — SECTION CSE-A (23 projects: slots 3 to 25)
    # =========================================================================
    (
        "Deep Learning-Based Skin Lesion Classification for Rural Telemedicine",
        "Convolutional neural network classifying dermoscopic lesion images into benign vs malignant categories with saliency maps.",
        "Rural primary health centers lack resident dermatologists, delaying early diagnosis of treatable malignant melanomas.",
        "Healthcare Technology", 3, "CSE-A"
    ),
    (
        "Zero-Trust Microsegmentation in Containerized Cloud Environments",
        "Security agent enforcing eBPF packet filtering and mutual TLS identity validation between microservices in Kubernetes.",
        "Perimeter-only firewall defenses allow attackers who breach a single container to freely move laterally across cloud clusters.",
        "Cybersecurity", 3, "CSE-A"
    ),
    (
        "Autonomous Indoor Quadcopter Navigation via Monocular VIO",
        "Visual-inertial odometry pipeline enabling GPS-denied drone path traversal and obstacle avoidance in warehouse corridors.",
        "Indoor autonomous drones lose spatial localization and crash when operating in GPS-denied environments.",
        "Robotics & AI", 3, "CSE-A"
    ),
    (
        "Edge-Computing Traffic Signal Optimization via Live Vehicle Flow",
        "YOLOv8 vehicle detection node installed on intersection cameras dynamically adjusting green light durations.",
        "Fixed-timer traffic lights cause severe traffic congestion and unnecessary engine idling on empty cross streets.",
        "Computer Vision", 3, "CSE-A"
    ),
    (
        "Federated Learning Framework for Medical Image Segmentation",
        "Privacy-preserving machine learning architecture training multi-organ CT segmentation models across hospitals without data sharing.",
        "Strict medical privacy laws prevent hospitals from pooling patient scans into centralized training datasets.",
        "AI/ML", 3, "CSE-A"
    ),
    (
        "Real-Time Phishing URL Detection Using Lexical and DNS Graph Analysis",
        "Browser security shield analyzing URL entropy, homoglyph substitutions, and passive DNS history to block credential phishing.",
        "Heuristic blacklist anti-phishing filters fail to detect zero-hour phishing domains generated by automated adversary kits.",
        "Cybersecurity", 3, "CSE-A"
    ),
    (
        "Smart Microgrid Energy Trading Platform via Consortium Blockchain",
        "Hyperledger-based decentralized energy token auction allowing rooftop solar prosumers to sell power directly to neighbors.",
        "Traditional electrical utilities offer low feed-in tariffs to rooftop solar producers while charging consumers high retail rates.",
        "Blockchain & Energy", 3, "CSE-A"
    ),
    (
        "Automated Pulmonary X-Ray Anomaly Detection and Triaging",
        "ResNet-50 computer vision pipeline flagging pneumothorax and bacterial pneumonia on chest radiographs for triage prioritization.",
        "Radiologists face high diagnostic backlogs in emergency departments, delaying critical treatment for acute lung collapse.",
        "Healthcare Technology", 3, "CSE-A"
    ),
    (
        "Decentralized Identity Verification for Academic Degree Credentialing",
        "W3C verifiable credential issuer creating tamper-proof cryptographic degree proofs on distributed ledgers.",
        "Recruiters spend weeks and incur high third-party background verification fees to authenticate paper engineering degrees.",
        "Blockchain", 3, "CSE-A"
    ),
    (
        "Wildlife Poaching Acoustic Detection System for Protected Reserves",
        "Solar-powered forest microphone nodes running edge audio classification models to detect gunshots and chainsaw signatures.",
        "Vast forest reserves suffer from illegal poaching and logging due to sparse human ranger patrol coverage.",
        "IoT & Audio AI", 3, "CSE-A"
    ),
    (
        "Automated Vulnerability Scanner for Smart Contract Bytecode",
        "Symbolic execution engine uncovering reentrancy vulnerabilities, integer overflows, and unhandled exceptions in EVM bytecode.",
        "Smart contract vulnerabilities lead to catastrophic decentralized finance exploits resulting in millions of dollars in stolen tokens.",
        "Cybersecurity", 3, "CSE-A"
    ),
    (
        "Precision Irrigation and Fertigation Controller Using LoRaWAN Telemetry",
        "Field sensor array communicating over long-range radio to regulate solar water pumps based on evapotranspiration indexes.",
        "Agricultural crops suffer yield reductions from improper fertilizer dilution and uncalibrated flood irrigation.",
        "Agriculture Technology", 3, "CSE-A"
    ),
    (
        "Cross-Lingual Sentiment Analysis for Disaster Relief Coordination",
        "Multilingual BERT pipeline classifying vernacular social media distress cries during major flood catastrophes.",
        "Emergency rescue teams struggle to filter critical geotagged rescue requests from social media noise during natural disasters.",
        "Disaster Management", 3, "CSE-A"
    ),
    (
        "High-Throughput Packet Inspection Engine with Hardware Acceleration",
        "DPDK-accelerated network probe performing deep packet inspection at line-rate 10Gbps speeds to identify botnet C2 communications.",
        "Software-based network intrusion detection tools drop packets and suffer high CPU exhaustion during high-volume DDoS attacks.",
        "Networking", 3, "CSE-A"
    ),
    (
        "Assistive Eye-Gaze Tracking Typing Interface for ALS Patients",
        "Webcam-based pupil center corneal reflection tracking system enabling paralyzed patients to type text using eye fixation.",
        "Commercial eye-tracking communication devices cost thousands of dollars, making them inaccessible to low-income ALS patients.",
        "Accessibility & Social Impact", 3, "CSE-A"
    ),
    (
        "Distributed Fault-Tolerant Key-Value Store with Raft Consensus",
        "Go-implemented distributed database providing linearizable read-after-write guarantees across network partitions.",
        "Distributed microservices face catastrophic split-brain state corruption when network partitions divide cluster nodes.",
        "Cloud & Distributed Systems", 3, "CSE-A"
    ),
    (
        "AI-Powered Diabetic Retinopathy Grading System",
        "Deep convolutional network grading retinal fundus photography into five diabetic retinopathy stages with microaneurysm heatmaps.",
        "Diabetes-related blindness is preventable with early detection, yet developing nations face severe ophthalmic specialist shortages.",
        "Healthcare Technology", 3, "CSE-A"
    ),
    (
        "Smart Helmet with Fall Detection and Emergency SOS for Two-Wheelers",
        "Accelerometer and gyroscope sensor helmet broadcasting GPS accident coordinates to nearest ambulance centers upon crash impact.",
        "Two-wheeler accident victims frequently die from brain trauma due to delayed medical response on isolated highways.",
        "IoT & Telematics", 3, "CSE-A"
    ),
    (
        "Automated Cloud Cost Optimization and Idle Resource Terminating Daemon",
        "Policy engine tracking AWS/Azure CPU utilization and terminating unattached EBS volumes and abandoned development instances.",
        "Software engineering organizations waste up to 35% of cloud expenditure on abandoned instances left running overnight.",
        "Cloud & Distributed Systems", 3, "CSE-A"
    ),
    (
        "Deepfake Video Detection Using Facial Micro-Expression Consistency",
        "Spatial-temporal neural network analyzing blink dynamics and photoplethysmography pulse signals to detect synthetic facial deepfakes.",
        "Generative adversarial deepfakes undermine trust in judicial digital evidence and enable sophisticated executive impersonation.",
        "Cybersecurity", 3, "CSE-A"
    ),
    (
        "Real-Time Air Quality Index (AQI) Prediction Using LSTM Networks",
        "Recurrent neural network forecasting PM2.5 and PM10 concentrations 24 hours in advance using meteorological telemetry.",
        "Citizens with chronic respiratory conditions lack advance micro-local air pollution forecasts to plan outdoor travel safety.",
        "Data Analytics", 3, "CSE-A"
    ),
    (
        "Automated Legal Document Summarization and Precedent Retrieval",
        "Transformer NLP architecture extracting key arguments, statutes, and citations from judicial appellate judgments.",
        "Lawyers spend hundreds of manual hours reading lengthy court rulings to locate pertinent legal precedents for active litigation.",
        "AI/ML", 3, "CSE-A"
    ),
    (
        "Software-Defined Networking (SDN) Dynamic QoS Routing Controller",
        "OpenFlow controller prioritizing telemedicine video packets over bulk file transfers during core link congestion.",
        "Unprioritized network traffic causes jitter and packet loss on critical low-latency telemedicine video consultations.",
        "Networking", 3, "CSE-A"
    ),

    # =========================================================================
    # THIRD YEAR — SECTION CSE-B (23 projects: slots 3 to 25)
    # =========================================================================
    (
        "Adversarial Robustness Testing on Autonomous Driving Vision Models",
        "Testing suite evaluating how adversarial patch attacks and simulated lens flare degrade road sign recognition in self-driving cars.",
        "Autonomous driving neural networks are susceptible to adversarial sticker attacks that cause dangerous stop-sign misclassifications.",
        "AI/ML & Security", 3, "CSE-B"
    ),
    (
        "Blockchain-Enabled Pharmaceutical Supply Chain Anti-Counterfeit Network",
        "Serial QR code tracking on Polygon ledger ensuring genuine drug provenance from active ingredient manufacturers to rural pharmacies.",
        "Counterfeit prescription medications infiltrate developing world supply chains, causing thousands of preventable patient fatalities.",
        "Blockchain", 3, "CSE-B"
    ),
    (
        "Automated ECG Arrhythmia Classification Using 1D Convolutional Networks",
        "Real-time Holter monitor algorithm identifying atrial fibrillation, PVCs, and heart blocks from streaming single-lead ECG data.",
        "Cardiac arrhythmias are often intermittent and missed during standard 10-second hospital ECG examinations.",
        "Healthcare Technology", 3, "CSE-B"
    ),
    (
        "Ransomware Behavioral Heuristics and Early Canary Detection System",
        "Endpoint agent monitoring file entropy spikes, shadow copy deletions, and Canary file changes to terminate malicious processes.",
        "Signature-based antivirus tools fail to block novel polymorphic ransomware before significant drive encryption occurs.",
        "Cybersecurity", 3, "CSE-B"
    ),
    (
        "Autonomous Underwater Vehicle (AUV) Coral Reef Bleaching Surveyor",
        "Submersible drone computer vision pipeline mapping coral reef pigmentation loss to measure climate change marine degradation.",
        "Marine biologists cannot conduct exhaustive physical diving surveys over expansive offshore coral reef systems.",
        "Environmental Sustainability", 3, "CSE-B"
    ),
    (
        "Cloud-Native Serverless Video Transcoding and Adaptive Bitrate Delivery",
        "Event-driven architecture slicing uploaded raw video into parallel chunks for HLS multi-resolution streaming.",
        "Monolithic video processing servers cause long transcoding delays and scale poorly during simultaneous media uploads.",
        "Cloud & Distributed Systems", 3, "CSE-B"
    ),
    (
        "Smart Cold Storage Monitoring and Spoilage Prediction for Produce",
        "IoT ethylene and temperature sensor node predicting rot onset in potato and apple storage facilities.",
        "Post-harvest agricultural cold storage failures lead to undetected rot spreading across thousands of metric tons of produce.",
        "Agriculture Technology", 3, "CSE-B"
    ),
    (
        "Automated Brain MRI Tumor Segmentation Using 3D U-Net",
        "Volumetric segmentation pipeline delineating enhancing tumor core, edema, and necrotic tissue for neurosurgical resection planning.",
        "Manual slice-by-slice 3D contouring of glioblastoma brain tumors on MRI scans requires hours of neuro-radiologist labor.",
        "Healthcare Technology", 3, "CSE-B"
    ),
    (
        "Intelligent Threat Hunting Using Security Information & Event Management (SIEM)",
        "Elasticsearch correlation engine identifying multi-stage cyber attack kill chains from heterogeneous firewall and auth logs.",
        "Security operation analysts are overwhelmed by millions of isolated log events, allowing advanced persistent threats to dwell undetected.",
        "Cybersecurity", 3, "CSE-B"
    ),
    (
        "Speech Emotion Recognition for Customer Call Center Quality Assurance",
        "Acoustic spectral neural network measuring customer frustration and agent empathy during telephone support conversations.",
        "Call center supervisors can audit less than 2% of recorded support calls, missing severe customer dissatisfaction events.",
        "AI/ML", 3, "CSE-B"
    ),
    (
        "Drone-Based Forest Fire Ignition Point Localization Using Thermal Imaging",
        "Aerial FLIR thermal imaging pipeline detecting smoldering subterranean embers before surface crown fires ignite.",
        "Wildfire response teams arrive after fires become uncontrollable because surface smoke is visible only after heavy combustion.",
        "Disaster Management", 3, "CSE-B"
    ),
    (
        "Decentralized P2P File Storage with Reed-Solomon Erasure Coding",
        "IPFS-compatible storage network fragmenting files into erasure-coded shards distributed across untrusted storage nodes.",
        "Centralized cloud storage vendors suffer service outages and create centralized data surveillance vectors for enterprise data.",
        "Cloud & Distributed Systems", 3, "CSE-B"
    ),
    (
        "Wearable Tremor Suppression Biomarker Analyzer for Parkinson's Patients",
        "Wristband IMU telemetry measuring tremor frequency and amplitude to assist neurologists in titrating dopaminergic medication.",
        "Neurologists rely on brief subjective in-clinic evaluations that fail to capture fluctuating daily motor tremors.",
        "Healthcare Technology", 3, "CSE-B"
    ),
    (
        "Zero-Knowledge Proof Authentication for Decentralized Banking",
        "zk-SNARK protocol allowing bank clients to prove sufficient credit scores and liquidity without revealing account balances.",
        "Financial loan applications expose sensitive personal balance sheets to third-party lending underwriters.",
        "Cybersecurity", 3, "CSE-B"
    ),
    (
        "Automated Soil Erosion Risk Mapping Using Satellite Imagery & GIS",
        "Normalized Difference Vegetation Index (NDVI) and slope elevation models predicting topsoil runoff vulnerability.",
        "Agricultural watersheds suffer severe irreversible topsoil loss due to unmonitored deforestation on steep hillsides.",
        "Environmental Sustainability", 3, "CSE-B"
    ),
    (
        "Real-Time Sign Language to Text Translation Using MediaPipe Hand Meshes",
        "LSTM gesture interpreter translating 50 American Sign Language phrases into synthesized audio speech in real time.",
        "Deaf individuals experience profound communication barriers when interacting with hearing individuals who do not know sign language.",
        "Accessibility & Social Impact", 3, "CSE-B"
    ),
    (
        "IoT-Driven Wastewater Quality Monitoring in Industrial Drainage",
        "Optical turbidity and chemical oxygen demand (COD) sensor nodes alerting pollution boards when toxic effluent is illegally discharged.",
        "Industrial factories secretly discharge untreated toxic chemical wastewater into rivers under the cover of night.",
        "Environmental Sustainability", 3, "CSE-B"
    ),
    (
        "Automated Synthetic Test Data Generator with Differential Privacy",
        "Generative adversarial pipeline synthesizing tabular banking datasets that preserve statistical correlations while preventing re-identification.",
        "Software testing teams cannot validate database applications with realistic data due to strict GDPR customer data regulations.",
        "Data Analytics & Privacy", 3, "CSE-B"
    ),
    (
        "Peer-to-Peer Mesh Messaging Network for Disaster Emergency Communications",
        "Bluetooth Low Energy and Wi-Fi Direct ad-hoc multi-hop messaging app functioning when cellular cell towers collapse.",
        "Hurricanes and earthquakes destroy cellular base stations, leaving trapped disaster victims completely unable to call for help.",
        "Disaster Management", 3, "CSE-B"
    ),
    (
        "Multi-Modal Fake Review Detection on E-Commerce Platforms",
        "Joint text and user behavior graph analysis identifying coordinated review rings and bot-generated product ratings.",
        "Consumers are deceived by fabricated five-star reviews orchestrated by paid merchant manipulation networks.",
        "Data Analytics", 3, "CSE-B"
    ),
    (
        "Automated Hydroponics Nutrient Dosing System Using Fuzzy Logic",
        "Closed-loop controller regulating pH and EC electrical conductivity via peristaltic dosing pumps for vertical indoor farms.",
        "Indoor vertical hydroponic crops perish rapidly when manual nutrient measurement errors disrupt water chemistry.",
        "Agriculture Technology", 3, "CSE-B"
    ),
    (
        "Continuous Integration / Continuous Deployment (CI/CD) Automated Security Gate",
        "GitHub Actions security pipeline blocking code merges containing hardcoded API secrets, vulnerable dependencies, and OWASP Top 10 flaws.",
        "Fast-paced developer release cycles frequently introduce unpatched software vulnerabilities into production cloud clusters.",
        "Cybersecurity", 3, "CSE-B"
    ),
    (
        "Elderly Fall Detection and Inactivity Alert Using Ambient Radar Sensors",
        "60GHz millimeter-wave radar sensor detecting elderly falls and respiratory rate without privacy-invasive cameras in living rooms.",
        "Elderly seniors living alone risk lying incapacitated for hours after accidental falls because wearable pendants are not worn.",
        "Healthcare Technology", 3, "CSE-B"
    ),

    # =========================================================================
    # THIRD YEAR — SECTION CSE-C (23 projects: slots 3 to 25)
    # =========================================================================
    (
        "Automated Ultrasound Fetal Growth Biometry Measurement",
        "Computer vision model delineating biparietal diameter and femur length on obstetric ultrasound scans to detect fetal growth restriction.",
        "Obstetric ultrasound measurements require manual calipers, leading to significant inter-observer variability in gestational age estimation.",
        "Healthcare Technology", 3, "CSE-C"
    ),
    (
        "Secure Multi-Party Computation for Collaborative Fraud Detection",
        "Cryptographic protocol enabling competitor retail banks to identify shared credit card fraud rings without sharing customer data.",
        "Banks cannot legally share private transaction histories, allowing organized fraud rings to exploit multiple banks in parallel.",
        "Cybersecurity", 3, "CSE-C"
    ),
    (
        "Drone-Based Power Transmission Line Inspection via Deep Learning",
        "Aerial inspection drone with telephoto lens detecting broken insulator discs and vegetation encroachment along high-voltage pylons.",
        "Human utility linemen perform perilous physical climbs on high-voltage electrical pylons to inspect transmission hardware.",
        "Computer Vision", 3, "CSE-C"
    ),
    (
        "Edge-Deployed Smart Stethoscope for Pediatric Wheeze & Crackle Detection",
        "Digital acoustic stethoscope running lightweight audio classifier identifying adventitious lung sounds in pediatric asthma.",
        "Early childhood asthma and bronchitis are frequently misdiagnosed in rural clinics lacking experienced pediatric pulmonologists.",
        "Healthcare Technology", 3, "CSE-C"
    ),
    (
        "Autonomous Weed Detection and Targeted Herbicide Spraying Robot",
        "Computer vision rover identifying weeds among agricultural rows and actuating micro-spray nozzles to reduce chemical runoff.",
        "Blanket chemical herbicide spraying across agricultural fields pollutes groundwater and increases farmer operational input costs.",
        "Agriculture Technology", 3, "CSE-C"
    ),
    (
        "Smart City Solid Waste Bin Fill-Level Prediction Using GNNs",
        "Graph neural network predicting garbage bin overflow probabilities across urban municipal zones to optimize garbage truck routes.",
        "Municipal collection trucks follow rigid static daily routes, emptying half-empty bins while overflowing dumpsters cause public health hazards.",
        "Environmental Sustainability", 3, "CSE-C"
    ),
    (
        "Container Security Auditing Tool for Kubernetes Clusters",
        "DaemonSet scanning running pod memory and filesystem permissions to detect privilege escalation and container breakout exploits.",
        "Misconfigured Kubernetes pods running with root capabilities allow compromised applications to hijack the underlying host node.",
        "Cybersecurity", 3, "CSE-C"
    ),
    (
        "Automated Structural Crack Detection in Concrete Bridges Using Drones",
        "Photogrammetry computer vision pipeline measuring sub-millimeter concrete fracture widths and surface spalling on highway bridges.",
        "Aging highway infrastructure relies on sporadic visual human inspections that miss micro-cracks before catastrophic bridge failures.",
        "Computer Vision", 3, "CSE-C"
    ),
    (
        "Blockchain-Based Verifiable Carbon Credit Marketplace",
        "Smart contract tokenization of verified industrial carbon offsets with transparent retirement receipts to prevent double-spending.",
        "Traditional voluntary carbon credit registries are plagued by phantom credits, double-counting, and lack of verified auditability.",
        "Blockchain & Energy", 3, "CSE-C"
    ),
    (
        "Predictive Maintenance for Industrial Wind Turbines Using Vibration Telemetry",
        "Anomaly detection model identifying gearbox bearing fatigue weeks before mechanical failure using vibration accelerometer data.",
        "Offshore wind turbine gearbox replacements incur massive crane charter costs that could be prevented with predictive maintenance.",
        "Data Analytics", 3, "CSE-C"
    ),
    (
        "Automated Speech Disfluency Classifier for Stuttering Therapy",
        "Audio model segmenting sound prolongations, syllable repetitions, and speech blocks to provide objective speech therapy progress tracking.",
        "Speech-language pathologists lack automated quantitative tools to measure patient disfluency reduction between clinical visits.",
        "Accessibility & Social Impact", 3, "CSE-C"
    ),
    (
        "Darknet Web Crawler for Threat Intelligence and Leaked Credential Alerting",
        "Tor-routed crawler searching onion breach forums for corporate email dumps and generating proactive security team notifications.",
        "Organizations discover compromised employee corporate credentials only after enterprise networks have been ransomed.",
        "Cybersecurity", 3, "CSE-C"
    ),
    (
        "Low-Cost Smart Prosthetic Hand with Surface EMG Grip Control",
        "3D-printed bionic hand decoding forearm muscle electrical signals into five proportional grasping patterns.",
        "Motorized prosthetic limbs cost over $20,000, leaving amputees in developing countries dependent on non-functional cosmetic prosthetics.",
        "Healthcare Technology", 3, "CSE-C"
    ),
    (
        "Automated Flood Inundation Depth Mapping from Sentinel-1 SAR Radar",
        "Synthetic Aperture Radar satellite imagery pipeline mapping ground water extent through thick storm cloud cover during monsoon crises.",
        "Optical satellites cannot see through dense cyclone storm clouds, leaving disaster coordinators blind to ground flood expansion.",
        "Disaster Management", 3, "CSE-C"
    ),
    (
        "Cloud Microservices Chaos Engineering and Resilience Testing Suite",
        "Automated chaos injector randomly killing Kubernetes pods and injecting latency to verify circuit breaker failover capabilities.",
        "Distributed cloud systems experience unexpected cascading outages when single downstream services become unresponsive.",
        "Cloud & Distributed Systems", 3, "CSE-C"
    ),
    (
        "Smart Aquaponics Water Chemistry Balance and Fish Feeder Automator",
        "Autonomous controller managing water circulation, dissolved oxygen, and fish feeding based on ammonia and nitrate thresholds.",
        "Closed-loop aquaponic ecosystems collapse rapidly when fish feeding rates cause toxic ammonia spikes that kill nitrifying bacteria.",
        "Agriculture Technology", 3, "CSE-C"
    ),
    (
        "Automated Security Compliance Checker for Cloud Infrastructure as Code",
        "Static analysis linter scanning Terraform and CloudFormation templates for unencrypted S3 buckets and overly permissive IAM roles.",
        "DevOps teams inadvertently deploy insecure cloud infrastructure definitions, creating publicly exposed data breaches.",
        "Cybersecurity", 3, "CSE-C"
    ),
    (
        "AI-Powered Audio Captioning for the Hearing Impaired",
        "Environmental audio event detector translating emergency sirens, doorbells, and kettle whistles into descriptive smartwatch haptic alerts.",
        "Deaf individuals sleeping or working in home environments miss critical audio alarm sirens and visitor doorbells.",
        "Accessibility & Social Impact", 3, "CSE-C"
    ),
    (
        "Automated Solar Plant Fault Detection Using Aerial Thermography",
        "Drone flight path software detecting defective bypass diodes, cracked solar cells, and string disconnects from radiometric thermal orthomosaics.",
        "Utility-scale solar farms containing hundreds of thousands of panels cannot be manually inspected on foot for hot-spot cell failures.",
        "Environmental Sustainability", 3, "CSE-C"
    ),
    (
        "Zero-Knowledge Identity Attestation for Age Verification",
        "Cryptographic mobile app verifying that a citizen is over 18 years old without revealing their date of birth, name, or address.",
        "Online age verification portals force citizens to upload full passport scans, creating severe identity theft risks.",
        "Cybersecurity", 3, "CSE-C"
    ),
    (
        "Autonomous Warehouse Inventory Scanning Rover Using LiDAR & RFID",
        "Ground autonomous mobile robot navigating warehouse aisles, reading high-shelf RFID pallet tags, and updating ERP databases.",
        "Manual warehouse inventory audits require closing facility operations and using dangerous scissor lifts to read pallet tags.",
        "Robotics & IoT", 3, "CSE-C"
    ),
    (
        "Deep Learning Automated Glaucoma Screening from Fundus Optic Cups",
        "Segmentation model computing cup-to-disc ratio and neuroretinal rim thinning to identify early asymptomatic glaucoma.",
        "Glaucoma causes irreversible optic nerve damage that often goes unnoticed until permanent peripheral vision loss occurs.",
        "Healthcare Technology", 3, "CSE-C"
    ),
    (
        "Energy-Efficient Routing Protocol for Underwater Acoustic Sensor Networks",
        "Cross-layer routing protocol minimizing acoustic modem transmissions to extend submerged oceanographic battery life.",
        "Underwater sensor nodes suffer from rapid battery depletion because acoustic water modems consume high transmission power.",
        "Networking", 3, "CSE-C"
    ),

    # =========================================================================
    # THIRD YEAR — SECTION CSE-D (23 projects: slots 3 to 25)
    # =========================================================================
    (
        "Automated Forensic Audio Deepfake Detection and Voice Spoofing Shield",
        "Bimodel classifier analyzing phase inconsistencies and higher-frequency spectral artifacts in synthesized voice cloning.",
        "Generative AI voice clones enable devastating CEO fraud and telephone extortion scams targeting vulnerable citizens.",
        "Cybersecurity", 3, "CSE-D"
    ),
    (
        "Smart Traffic Emergency Corridor Preemption for Fire Engines",
        "Vehicle-to-Infrastructure (V2I) radio beacon preemptively turning traffic signals green along designated emergency vehicle paths.",
        "Fire engines and ambulances lose critical golden-hour response minutes caught in dense urban intersection bottlenecks.",
        "IoT & Transportation", 3, "CSE-D"
    ),
    (
        "Edge AI-Based Crop Pest Detection and Biopesticide Advisory",
        "Mobile vision classifier identifying invasive fall armyworms and stem borers and generating organic biopesticide recommendations.",
        "Smallholder farmers struggle to identify destructive insect pests early, leading to catastrophic crop defoliation.",
        "Agriculture Technology", 3, "CSE-D"
    ),
    (
        "Automated Coronary Artery Calcium Scoring from Low-Dose CT Scans",
        "Deep convolutional network quantifying calcified arterial plaques to assess cardiovascular heart attack risk.",
        "Preventive heart attack screening is limited by the manual time required for radiologists to contour individual coronary calcifications.",
        "Healthcare Technology", 3, "CSE-D"
    ),
    (
        "Continuous Multi-Factor Authentication via Keyboard Keystroke Dynamics",
        "Behavioral biometrics daemon evaluating user typing cadence, flight times, and dwell times to lock sessions during unauthorized takeovers.",
        "Session hijacking and unattended unlocked workstations allow unauthorized insiders to access sensitive enterprise records.",
        "Cybersecurity", 3, "CSE-D"
    ),
    (
        "AI-Powered River Surface Debris and Plastic Waste Tracker",
        "Camera stream object detection model counting and categorizing plastic bottles and debris flowing along urban waterways.",
        "Environmental agencies lack quantitative empirical data on plastic waste discharge rates into coastal oceans.",
        "Environmental Sustainability", 3, "CSE-D"
    ),
    (
        "Decentralized Micro-Insurance for Smallholder Drought Protection",
        "Smart contract oracle executing automatic insurance payouts to verified farmers when satellite rainfall metrics fall below threshold.",
        "Traditional agricultural crop insurance claims take months to process and require corruptible human field adjusters.",
        "Blockchain & Agriculture", 3, "CSE-D"
    ),
    (
        "Automated Sleep Apnea Event Classifier from Wearable SpO2 Data",
        "Time-series model detecting obstructive sleep apnea hypopneas from nightly pulse oximetry and heart rate variability signals.",
        "In-laboratory clinical polysomnography sleep studies are prohibitively expensive and require uncomfortable overnight sensor wiring.",
        "Healthcare Technology", 3, "CSE-D"
    ),
    (
        "Threat Intelligence Sharing Platform with Automated Indicator Extraction",
        "STIX/TAXII-compliant platform extracting and sharing malicious IP and file hash indicators across partner financial institutions.",
        "Cyber threat response is hampered when individual institutions do not rapidly disseminate indicators of compromise to peers.",
        "Cybersecurity", 3, "CSE-D"
    ),
    (
        "Automated Highway Pothole and Road Distress Surveyor via Dashcam",
        "Edge vision model installed on public transit buses mapping GPS pothole coordinates and asphalt distress severity.",
        "Municipal public works departments lack up-to-date road quality data, leading to severe vehicle suspension damage and accidents.",
        "Computer Vision", 3, "CSE-D"
    ),
    (
        "Self-Healing Software-Defined Network Topology for Smart Grids",
        "OpenFlow network controller automatically rerouting smart meter substations around fiber cuts within 50 milliseconds.",
        "Electrical distribution grids risk catastrophic regional blackouts when communication links to protection relays fail.",
        "Networking", 3, "CSE-D"
    ),
    (
        "Accessible Screen Reading Interface for Math Equations and LaTeX",
        "Mathematical formula parser converting complex calculus integrals and matrices into natural spoken audio descriptions.",
        "Visually impaired STEM students encounter major learning barriers because standard screen readers mispronounce complex mathematical syntax.",
        "Accessibility & Social Impact", 3, "CSE-D"
    ),
    (
        "Automated Microscopic Malaria Parasite Blood Smear Counter",
        "Computer vision pipeline detecting Plasmodium falciparum ring forms in Giemsa-stained thin blood film micrographs.",
        "Manual microscopic examination of blood smears for malaria is time-intensive and suffers from high technician fatigue error rates.",
        "Healthcare Technology", 3, "CSE-D"
    ),
    (
        "Decentralized Domain Name Service Resistant to DNS Hijacking",
        "Blockchain-based domain registry resolving website IP mappings without centralized root servers or ICANN authority.",
        "Centralized DNS servers are vulnerable to government censorship, BGP hijacking, and unauthorized domain seizures.",
        "Cybersecurity & Blockchain", 3, "CSE-D"
    ),
    (
        "Automated Forest Biomass & Carbon Stock Estimation Using LiDAR Data",
        "Point cloud machine learning pipeline measuring individual tree crown heights and diameters to calculate forest carbon storage.",
        "Carbon offset certification projects require expensive manual forest forestry plots that sample less than 1% of tree populations.",
        "Environmental Sustainability", 3, "CSE-D"
    ),
    (
        "Smart Helmet with Heat Stress Warning for Construction Workers",
        "Thermal and heart rate telemetry monitoring industrial site workers and sounding cooling alarms before heat stroke collapse.",
        "Construction workers exposed to high ambient summer heat suffer from heat exhaustion and fatal occupational heat strokes.",
        "Healthcare & Safety", 3, "CSE-D"
    ),
    (
        "Automated Source Code Vulnerability Repair Using Code LLMs",
        "Fine-tuned language model identifying SQL injections and buffer overflows in C/Java repos and generating validated patch pull requests.",
        "Developers take an average of 200 days to patch known vulnerabilities due to competing feature development deadlines.",
        "Cybersecurity & AI", 3, "CSE-D"
    ),
    (
        "Low-Latency Peer-to-Peer Video Telephony Engine for Remote Classrooms",
        "WebRTC communication mesh dynamically adjusting video encoding bitrates for rural 2G/3G connectivity constraints.",
        "Students in rural regions with low bandwidth are excluded from online lectures because commercial platforms require high bitrates.",
        "Networking", 3, "CSE-D"
    ),
    (
        "Autonomous Floor Disinfection Robot with Obstacle Avoidance for Hospitals",
        "SLAM-navigated ground rover deploying calibrated UV-C ultraviolet radiation to sterilize hospital patient wards after discharge.",
        "Hospital-acquired bacterial infections spread when patient rooms are incompletely sanitized between patient admissions.",
        "Robotics & Healthcare", 3, "CSE-D"
    ),
    (
        "Automated Seismic P-Wave Detection and Earthquake Warning Siren",
        "MEMS accelerometer network running edge filter algorithms detecting fast P-waves and broadcasting 10-second warning sirens before S-waves strike.",
        "Metropolitan transit networks and gas pipelines need 5 to 10 seconds of advance warning to safely shut down before destructive earthquake shaking.",
        "Disaster Management", 3, "CSE-D"
    ),
    (
        "Crowdsourced Noise Pollution Map and Urban Planning Advisory",
        "Mobile acoustic sampling app generating city-wide noise exposure maps to assist municipal zoning and hospital location planning.",
        "Urban planning authorities lack granular street-level noise maps to enforce noise abatement standards near schools and hospitals.",
        "Data Analytics", 3, "CSE-D"
    ),
    (
        "Automated Contract Risk Clause Flagging for Small Businesses",
        "NLP legal transformer identifying indemnity obligations, unilateral termination clauses, and non-compete liabilities in commercial vendor contracts.",
        "Small businesses sign unfavorable commercial agreements because they cannot afford specialized legal contract review counsel.",
        "AI/ML", 3, "CSE-D"
    ),
    (
        "Decentralized Supply Chain Provenance for Fair-Trade Organic Coffee",
        "Consortium ledger tracing coffee bean sacks from rural farming cooperatives to European roasteries with fair-wage payout receipts.",
        "Corporate greenwashing obscures whether coffee beans marketed as fair-trade actually provided living wages to rural coffee farmers.",
        "Blockchain & Agriculture", 3, "CSE-D"
    ),

    # =========================================================================
    # FOURTH YEAR — SECTION CSE-A (23 projects: slots 3 to 25)
    # =========================================================================
    (
        "Autonomous Micro-Aerial Vehicle Exploration in Post-Disaster Collapsed Structures",
        "Ultra-lightweight multi-rotor drone performing 3D LiDAR SLAM and human survivor thermal detection inside collapsed concrete buildings.",
        "First responders cannot safely enter partially collapsed buildings after earthquakes without knowing survivor locations and structural stability.",
        "Robotics & Disaster Mgmt", 4, "CSE-A"
    ),
    (
        "Zero-Knowledge Rollup Engine for High-Throughput Layer-2 Blockchain Scaling",
        "STARK-based transaction rollup aggregating thousands of off-chain transactions into a single cryptographic validity proof.",
        "Ethereum Layer-1 transaction throughput of 15 transactions per second creates prohibitive gas fees during peak decentralized network usage.",
        "Blockchain & Distributed Systems", 4, "CSE-A"
    ),
    (
        "Federated Multi-Task Learning for Genomic Variant Pathogenicity Prediction",
        "Privacy-preserving machine learning framework predicting clinical pathogenicity of rare genetic variants across global genomics institutes.",
        "Rare disease research is severely hindered because national genomic databases cannot legally pool patient genetic data across borders.",
        "Bioinformatics & AI", 4, "CSE-A"
    ),
    (
        "Automated Continuous Penetration Testing Agent via Deep Q-Networks",
        "Reinforcement learning agent autonomously discovering privilege escalation and credential pivot paths across enterprise Active Directory domains.",
        "Annual point-in-time penetration tests miss security vulnerabilities introduced into enterprise infrastructure between testing cycles.",
        "Cybersecurity", 4, "CSE-A"
    ),
    (
        "Brain-Computer Interface (BCI) for Motor-Impaired Robotic Arm Manipulation",
        "Non-invasive EEG signal processing pipeline classifying motor imagery intent into 6-DOF robotic manipulator commands.",
        "Severe quadriplegic patients cannot manipulate physical drinking cups and objects without invasive and expensive neural brain implants.",
        "Accessibility & Robotics", 4, "CSE-A"
    ),
    (
        "Hyperspectral Satellite Image Segmentation for Illegal Deforestation Tracking",
        "Convolutional attention transformer detecting covert canopy thinning and illegal logging roads under dense tropical cloud cover.",
        "Conventional optical satellite imagery misses selective covert tree felling under dense forest canopy layers.",
        "Environmental Sustainability", 4, "CSE-A"
    ),
    (
        "Real-Time Cyber Threat Attribution Using Graph Neural Networks",
        "Graph neural network analyzing malware compilation artifacts and infrastructure hosting graphs to attribute attacks to known APT groups.",
        "Cyber adversaries camouflage attacks using shared tooling, delaying state-sponsored attack attribution for national security teams.",
        "Cybersecurity", 4, "CSE-A"
    ),
    (
        "Ultra-Low Power Edge ML Accelerator for Implantable Cardiac Defibrillators",
        "Sub-milliwatt quantized neural network hardware architecture identifying ventricular fibrillation within 500 milliseconds on battery implants.",
        "Implantable defibrillators risk delivering painful inappropriate electrical shocks to patients when simple threshold algorithms mistake noise for arrhythmia.",
        "Healthcare Technology", 4, "CSE-A"
    ),
    (
        "Distributed Quantum Key Distribution (QKD) Network Simulation and Routing",
        "Network simulator modeling quantum photon entanglement distribution, quantum memory decoherence, and trusted repeater routing.",
        "Post-quantum computing will break existing RSA and ECC cryptography, requiring quantum-secure key distribution network architectures.",
        "Networking & Cryptography", 4, "CSE-A"
    ),
    (
        "Multi-Agent Reinforcement Learning for Urban Traffic Grid Congestion Relief",
        "Decentralized MARL policy controlling 50 interconnected traffic intersections to eliminate shockwave gridlock in dense city centers.",
        "Single-intersection traffic controllers operate in isolation, pushing congestion onto adjacent intersections and worsening urban gridlock.",
        "AI/ML & Urban Systems", 4, "CSE-A"
    ),
    (
        "Autonomous Micro-Surgery Needle Tracking via Stereo Endoscopic Vision",
        "Sub-millimeter 3D surgical instrument tracker providing real-time tactile tremor compensation overlays for laparoscopic surgeons.",
        "Microvascular surgical procedures require human hand precision at the millimeter boundary where physiological tremor causes vessel tears.",
        "Healthcare & Robotics", 4, "CSE-A"
    ),
    (
        "Privacy-Preserving Contactless Vital Sign Monitoring via Ambient Wi-Fi CSI",
        "Channel State Information (CSI) Doppler analyzer measuring respiration and heart rates through bedroom walls without cameras.",
        "Elderly patient monitoring using cameras violates privacy, while wearable watches are frequently forgotten on bedside chargers.",
        "Healthcare & IoT", 4, "CSE-A"
    ),
    (
        "Decentralized Oracle Protocol with Stake-Slashing Dispute Resolution",
        "Cryptographic oracle network fetching off-chain financial prices with multi-source median aggregation and cryptographic fraud proofs.",
        "DeFi lending protocols suffer multi-million dollar exploits when centralized price oracles are manipulated via flash loan attacks.",
        "Blockchain", 4, "CSE-A"
    ),
    (
        "Automated Formal Verification of Distributed Consensus Protocols",
        "TLA+ model checking framework exhaustively verifying safety, liveness, and fault recovery properties in novel blockchain consensus algorithms.",
        "Subtle race conditions and partition edge cases in distributed consensus protocols escape manual code audits and crash live production networks.",
        "Cloud & Distributed Systems", 4, "CSE-A"
    ),
    (
        "AI-Driven Drug Molecule Binding Affinity Predictor Using 3D Graph CNNs",
        "Geometric deep learning architecture predicting binding free energy between small molecule ligands and target viral protease pockets.",
        "In vitro laboratory chemical synthesis of prospective drug candidates costs millions of dollars and requires years of trial and error.",
        "Healthcare Technology", 4, "CSE-A"
    ),
    (
        "Edge-Native Video Analytics with Adaptive Frame Pruning for Drone Swarms",
        "Dynamic inference pipeline pruning redundant aerial video frames to maintain real-time target tracking over low-bandwidth swarm ad-hoc links.",
        "Drone swarms tracking disaster survivors flood inter-drone radio links with redundant high-definition video frames, causing target loss.",
        "Robotics & Edge AI", 4, "CSE-A"
    ),
    (
        "Zero-Trust Identity Provider with Hardware Enclave (SGX) Attestation",
        "Identity microservice executing token generation and user password verification inside Intel SGX secure hardware enclaves.",
        "Host operating system compromises and root privileges allow adversaries to dump memory contents and steal plaintext authentication secrets.",
        "Cybersecurity", 4, "CSE-A"
    ),
    (
        "Explainable AI Diagnostic Assistant for Intensive Care Unit (ICU) Sepsis Onset",
        "Temporal transformer with SHAP feature attributions predicting septic shock 6 hours in advance from streaming telemetry.",
        "Sepsis mortality increases 8% for every hour treatment is delayed, yet clinicians lack early alert systems with transparent clinical rationale.",
        "Healthcare Technology", 4, "CSE-A"
    ),
    (
        "Autonomous Surface Vessel (ASV) for Port Oil Spill Containment",
        "Autonomous catamaran robot deploying absorbent boom barriers and skimming surface hydrocarbons based on thermal camera plume tracking.",
        "Maritime fuel spills in industrial ports spread rapidly across shorelines before human spill response teams can deploy manual booms.",
        "Environmental & Robotics", 4, "CSE-A"
    ),
    (
        "Post-Quantum Cryptographic Migration Suite for Legacy TLS Web Services",
        "Drop-in reverse proxy integrating Kyber and Dilithium algorithms to protect enterprise web servers against harvest-now-decrypt-later attacks.",
        "Adversaries are currently capturing encrypted enterprise network traffic to decrypt it once scalable quantum computers become operational.",
        "Cybersecurity", 4, "CSE-A"
    ),
    (
        "Cross-Lingual Speech-to-Speech Translation for Emergency Healthcare Dispatches",
        "Low-latency neural pipeline translating spoken regional dialect calls into standardized medical English dispatch alerts in under 800ms.",
        "Emergency ambulance dispatchers speaking English and Hindi struggle to understand rural dialect calls during medical emergencies.",
        "AI/ML & Healthcare", 4, "CSE-A"
    ),
    (
        "Autonomous Glider Path Planning for Ocean Salinity & Temperature Profiling",
        "Deep reinforcement learning planner optimizing ocean underwater glider buoyancy cycles to sample marine thermocline anomalies.",
        "Oceanographic underwater gliders drift off target course due to strong undersea boundary currents, losing critical climate profile data.",
        "Environmental Sustainability", 4, "CSE-A"
    ),
    (
        "Self-Supervised Pre-Training Architecture for Industrial Time-Series Anomalies",
        "Contrastive learning pipeline learning robust operational representations from unlabelled telemetry across gas turbine power plants.",
        "Industrial sensor streams generate petabytes of unlabelled time-series data where manual labelling of rare catastrophic faults is impossible.",
        "Data Analytics & AI", 4, "CSE-A"
    ),

    # =========================================================================
    # FOURTH YEAR — SECTION CSE-B (23 projects: slots 3 to 25)
    # =========================================================================
    (
        "Neuromorphic Event-Camera Vision for High-Speed Drone Obstacle Avoidance",
        "Spiking neural network processing microsecond event-camera polarity streams to navigate quadcopters through flying obstacles at 15 m/s.",
        "Standard frame-based cameras suffer from motion blur and 30ms latency, causing high-speed autonomous drones to collide with thin wires.",
        "Robotics & Neuromorphic AI", 4, "CSE-B"
    ),
    (
        "Automated Micro-Architectural Side-Channel Attack Detection in Cloud VMs",
        "Hardware performance counter daemon detecting Spectre and Meltdown branch history cache manipulation across co-tenant hypervisors.",
        "Multi-tenant public cloud virtual machines are vulnerable to side-channel cache attacks that extract cryptographic keys across VM boundaries.",
        "Cybersecurity", 4, "CSE-B"
    ),
    (
        "Decentralized Clinical Trial Data Exchange with Differential Privacy",
        "Blockchain consortium allowing international pharmaceutical researchers to query clinical trial cohorts while mathematically bounding privacy loss.",
        "Pharmaceutical clinical trials remain siloed, preventing meta-analyses of rare drug side effects due to patient confidentiality regulations.",
        "Healthcare Technology", 4, "CSE-B"
    ),
    (
        "Autonomous Agricultural Combine Harvester Fleet Coordination via V2V",
        "Vehicle-to-vehicle coordination algorithm synchronizing uncrewed grain combine harvesters with autonomous grain transport tractor trailers.",
        "Grain harvest operations lose significant operational hours when combine harvesters must halt harvesting to wait for manual grain cart arrival.",
        "Agriculture & Robotics", 4, "CSE-B"
    ),
    (
        "Graph Neural Network for Real-Time Money Laundering Ring Detection",
        "Scalable graph neural network traversing millions of daily SWIFT transaction edges to identify layering cycles and mule accounts.",
        "Traditional rule-based banking anti-money laundering systems produce over 95% false positives, missing sophisticated multi-hop laundering syndicates.",
        "Data Analytics & Security", 4, "CSE-B"
    ),
    (
        "Wearable EEG Seizure Prediction and Vagus Nerve Stimulation Trigger",
        "Embedded recurrent neural network forecasting epileptic seizure onset 5 minutes in advance from wearable behind-the-ear electrodes.",
        "Epilepsy patients suffer physical head trauma and drownings from unpredicted sudden loss of motor consciousness during grand mal seizures.",
        "Healthcare Technology", 4, "CSE-B"
    ),
    (
        "Decentralized Autonomous Organization (DAO) Governance with Sybil Resistance",
        "Proof-of-Humanity quadratic voting engine preventing wealthy token whales from monopolizing open-source treasury fund grants.",
        "Decentralized governance token votes are routinely hijacked by venture capital token holders who outvote the actual developer community.",
        "Blockchain", 4, "CSE-B"
    ),
    (
        "Autonomous Inspection Rover for Underground Nuclear Waste Repositories",
        "Radiation-hardened crawler robot with gamma spectrometer mapping radioactive isotope leakage in deep geological disposal caverns.",
        "Underground nuclear waste repositories are too hazardous for human inspectors to enter for routine structural and radiation inspections.",
        "Robotics & Nuclear Safety", 4, "CSE-B"
    ),
    (
        "Zero-Trust Cloud Workload Protection Platform via Kernel Runtime Security",
        "eBPF Linux LSM kernel module intercepting unauthorized process executions, container escapes, and memory injections in real time.",
        "Traditional user-space endpoint security agents can be bypassed or disabled by attackers who obtain root privileges inside cloud servers.",
        "Cybersecurity", 4, "CSE-B"
    ),
    (
        "Automated Retinal Micro-Vascular Density Quantification for Stroke Risk",
        "Optical coherence tomography angiography (OCTA) pipeline quantifying capillary dropout to predict cerebrovascular stroke risk.",
        "Early vascular warning signs of impending ischemic stroke are visible in the micro-vasculature of the eye but are difficult to quantify manually.",
        "Healthcare Technology", 4, "CSE-B"
    ),
    (
        "Dynamic Spectrum Access and Cognitive Radio Mesh for Rural Connectivity",
        "Software-defined radio network dynamically sensing and hopping into vacant TV white space frequencies to deliver gigabit rural broadband.",
        "Rural communities lack fiber broadband infrastructure while licensed television spectrum bands remain completely unused across rural regions.",
        "Networking", 4, "CSE-B"
    ),
    (
        "Predictive Wildfire Spread Simulation Using Coupled Atmospheric Models",
        "Cellular automata pipeline coupled with real-time satellite wind vectors predicting wildfire front progression 12 hours ahead.",
        "Firefighting commanders lack accurate predictive models of wildfire flank expansion, risking evacuation crews being trapped by sudden wind shifts.",
        "Disaster Management", 4, "CSE-B"
    ),
    (
        "Autonomous Robotic Sorting System for Mixed Electronic Waste Components",
        "Delta robot with multi-spectral vision picking and desoldering reusable microcontrollers and rare-earth components from e-waste PCBs.",
        "Millions of tons of discarded circuit boards are incinerated or landfilled because manual desoldering of microchips is economically unviable.",
        "Robotics & Sustainability", 4, "CSE-B"
    ),
    (
        "Post-Quantum Homomorphic Encryption for Secure Cloud Database Queries",
        "Lattice-based homomorphic cryptosystem executing SQL aggregations and joins directly on ciphertext without decrypting data in cloud memory.",
        "Enterprises cannot utilize public cloud databases for sensitive healthcare data because database servers hold decryption keys in RAM.",
        "Cybersecurity & Cryptography", 4, "CSE-B"
    ),
    (
        "Deep Learning Automated Dialysis Adequacy and Fluid Overload Estimator",
        "Ultrasound inferior vena cava collapsibility analyzer estimating precise dry-weight targets for end-stage renal disease hemodialysis.",
        "Hemodialysis patients suffer from cardiovascular hypotension or fluid overload when clinical dry-weight targets are estimated inaccurately.",
        "Healthcare Technology", 4, "CSE-B"
    ),
    (
        "Autonomous Tethered Aerostat Communication Relay for Mountain Disasters",
        "Tethered helium aerostat with 4G/5G cellular payload providing 30km emergency communication bubbles over collapsed mountain valleys.",
        "Mountain landslides isolate remote Himalayan valleys from all ground rescue coordination and satellite phone reception.",
        "Disaster Management", 4, "CSE-B"
    ),
    (
        "Automated Source-Code Formal Verification of Smart Contract Financial Protocols",
        "Bytecode verification framework mathematically proving that token conservation invariants hold under all possible transaction orderings.",
        "Complex decentralized finance lending pools contain unforeseen economic arbitrage bugs that drain depositor funds.",
        "Blockchain & Formal Methods", 4, "CSE-B"
    ),
    (
        "High-Speed Train Wheel Bearing Acoustic Fault Diagnostic Edge System",
        "Trackside directional microphone array detecting internal bearing spalling from passing express train wheel acoustic signatures.",
        "Railway wheel bearing seizures cause high-speed freight train derailments that cost millions of dollars in rail infrastructure destruction.",
        "IoT & Transportation", 4, "CSE-B"
    ),
    (
        "Automated Pancreatic Cancer Detection on Contrast CT Using Dual-Phase CNNs",
        "Deep convolutional pipeline detecting subtle hypo-attenuating pancreatic ductal adenocarcinoma lesions on arterial and venous CT scans.",
        "Pancreatic cancer has a dismal 9% five-year survival rate because early small lesions are visually subtle and missed on routine abdominal CT scans.",
        "Healthcare Technology", 4, "CSE-B"
    ),
    (
        "Autonomous Search and Rescue Swarm Coordination with Decentralized Task Allocation",
        "Consensus-based market auction algorithm assigning search grid sectors among 10 collaborative autonomous aerial and ground rovers.",
        "Multi-robot search and rescue teams fail when centralized ground control stations lose radio line-of-sight to wilderness rover fleets.",
        "Robotics & Disaster Mgmt", 4, "CSE-B"
    ),
    (
        "Privacy-Preserving Targeted Ad Delivery via On-Device Federated Embeddings",
        "Mobile browser recommendation engine matching advertiser categories locally without transmitting user browsing histories to ad servers.",
        "Online ad networks track intimate user web browsing histories across third-party cookies, violating basic digital privacy rights.",
        "AI/ML & Privacy", 4, "CSE-B"
    ),
    (
        "Automated Structural Health Monitoring of Hydroelectric Dam Foundations",
        "InSAR radar interferometry and acoustic emission sensor network detecting sub-millimeter foundation settlement in large concrete dams.",
        "Catastrophic hydroelectric dam ruptures destroy downstream river valleys when foundation seepage settlement occurs undetected.",
        "Civil Tech & IoT", 4, "CSE-B"
    ),
    (
        "Autonomous Agricultural Greenhouse Drone for Micro-Pollination of Crops",
        "Centimeter-scale micro-drone using visual servoing to gently vibrate blossom stigma for greenhouse tomato and strawberry pollination.",
        "Global pollinator bee declines and indoor vertical farm architectures require artificial pollination solutions to maintain fruit yields.",
        "Agriculture & Robotics", 4, "CSE-B"
    ),

    # =========================================================================
    # FOURTH YEAR — SECTION CSE-C (23 projects: slots 3 to 25)
    # =========================================================================
    (
        "Quantum-Resistant Identity and Signature Scheme for Connected Autonomous Vehicles",
        "Stateful hash-based signature architecture signing V2X road safety telemetry within 2ms to prevent vehicle spoofing attacks.",
        "Connected vehicle platoons risk fatal highway collisions if malicious actors broadcast fabricated emergency braking beacon messages.",
        "Cybersecurity & Autonomous Tech", 4, "CSE-C"
    ),
    (
        "Autonomous Glaucoma Progression Modeling via Longitudinal OCT Volumetric Sequences",
        "Spatio-temporal neural network modeling 3D retinal nerve fiber layer thinning trajectories to predict blindness onset.",
        "Ophthalmologists struggle to determine whether slow visual field changes represent true glaucoma deterioration or natural aging.",
        "Healthcare Technology", 4, "CSE-C"
    ),
    (
        "Edge-Native Distributed Video Analytics for Smart Harbor Container Tracking",
        "Mesh of edge camera nodes tracking shipping container ISO codes and port straddle carrier vehicle paths in real-time.",
        "Maritime shipping ports lose millions in operational demurrage fees due to misplaced shipping containers in sprawling container yards.",
        "Computer Vision & IoT", 4, "CSE-C"
    ),
    (
        "Automated Adversarial Audio Defense for Voice-Controlled Smart Home Ecosystems",
        "Audio pre-processing filter attenuating inaudible ultrasonic carrier waves used by adversaries to inject hidden voice commands.",
        "Inaudible ultrasound acoustic attacks can command smart home speakers to open smart door locks and authorize unauthorized purchases.",
        "Cybersecurity", 4, "CSE-C"
    ),
    (
        "Decentralized Renewable Energy Micro-Grid with Automated P2P Settlement",
        "Smart contracts executing sub-second kilowatt billing between neighboring rooftop solar arrays and industrial battery banks.",
        "Centralized utility feed-in tariffs discourage localized micro-grid resilience by extracting heavy intermediary transmission charges.",
        "Blockchain & Energy", 4, "CSE-C"
    ),
    (
        "Autonomous Quadruped Inspection Robot for Hazardous Chemical Refineries",
        "Four-legged walking robot traversing steep industrial pipe stairs and identifying volatile gas leaks using thermal gas imaging.",
        "Industrial chemical refinery disasters occur when human operators cannot safely approach toxic pressurized gas pipe leaks.",
        "Robotics & Industrial Safety", 4, "CSE-C"
    ),
    (
        "Federated Learning on Non-IID Telecommunications Data for Churn Prediction",
        "Privacy-preserving federated architecture training customer retention models across regional telecom circles with distinct user demographics.",
        "Telecommunications operators cannot share customer calling records across national jurisdictions due to telecommunications secrecy laws.",
        "Data Analytics & AI", 4, "CSE-C"
    ),
    (
        "Deep Learning Automated Coronary Plaque Characterization in IVUS Ultrasound",
        "Intravascular ultrasound image analyzer segmenting fibrotic, lipid-rich, and calcified plaques to guide coronary stent expansion.",
        "Cardiologists deploying coronary stents cannot reliably differentiate soft vulnerable plaques from calcified tissue on grayscale IVUS scans.",
        "Healthcare Technology", 4, "CSE-C"
    ),
    (
        "Zero-Knowledge Proofs for Verifiable Machine Learning Model Inference",
        "zk-SNARK circuit proving that a proprietary credit scoring model was executed correctly on client input without revealing model weights.",
        "Consumers have no guarantee that proprietary cloud AI models actually computed outcomes honestly without discriminatory hidden biases.",
        "AI/ML & Cryptography", 4, "CSE-C"
    ),
    (
        "Automated Detection of Security Vulnerabilities in Smart Contract State Transition Graphs",
        "Formal model extracting state machine graphs from Solidity bytecode to detect invariant violations and unauthorized state transitions.",
        "Decentralized autonomous organizations lose funds when complex inter-contract state transitions create unintended governance bypass loops.",
        "Cybersecurity & Blockchain", 4, "CSE-C"
    ),
    (
        "Autonomous Weed Classification and Mechanical Micro-Weeding Agricultural Rover",
        "Real-time edge vision rover identifying invasive weed species and actuating mechanical blades to eliminate chemical pesticide use.",
        "Chemical weedkillers contaminate agricultural soils and accelerate herbicide-resistant superweed mutations across croplands.",
        "Agriculture & Robotics", 4, "CSE-C"
    ),
    (
        "AI-Driven Real-Time Biomarker Discovery for Sepsis Subphenotypes",
        "Clustering pipeline identifying dynamic ICU patient subphenotypes that respond differently to corticosteroid and fluid resuscitation therapy.",
        "Sepsis is clinically heterogeneous, causing one-size-fits-all medical treatment protocols to fail in distinct patient cohorts.",
        "Healthcare Technology", 4, "CSE-C"
    ),
    (
        "Autonomous Underwater Vehicle with Acoustic Swarm Communication for Benthic Mapping",
        "Underwater robot swarm using acoustic modems and visual odometry to map benthic marine ecosystems and shipwreck sites.",
        "Single autonomous underwater vehicles take months to map extensive seabed zones due to limited operational battery endurance.",
        "Robotics & Marine Science", 4, "CSE-C"
    ),
    (
        "Zero-Trust Access Architecture for Hybrid Cloud Enterprise Infrastructure",
        "Continuous device trust scoring engine enforcing context-aware ephemeral access tokens based on endpoint security posture.",
        "Compromised employee laptops connecting over traditional corporate VPNs gain unfettered access to all internal enterprise databases.",
        "Cybersecurity", 4, "CSE-C"
    ),
    (
        "Predictive Flash Flood Inundation Modeling Using Ensemble Hydrodynamic Simulations",
        "GPU-accelerated 2D shallow water equation solver predicting urban neighborhood flash flood inundation depths 3 hours in advance.",
        "Urban storm drainage systems are overwhelmed by short intense cloudbursts, giving municipal emergency crews zero time to evacuate underpasses.",
        "Disaster Management", 4, "CSE-C"
    ),
    (
        "Automated Cervical Cancer Screening via Deep Learning on Pap Smear Cytology",
        "Multi-scale convolutional neural network detecting dysplastic squamous cells and atypical nuclei on whole-slide digital cytology scans.",
        "Developing world communities face severe cervical cancer mortality due to the scarcity of trained cytotechnologists to screen Pap smears.",
        "Healthcare Technology", 4, "CSE-C"
    ),
    (
        "Decentralized Public Key Infrastructure (DPKI) for Resilient IoT Device Authentication",
        "Decentralized ledger storing immutable device public keys and revocation lists to eliminate single points of failure in IoT PKI.",
        "Compromised centralized certificate authorities allow adversaries to forge certificates and push malicious firmware to millions of IoT devices.",
        "Cybersecurity & Blockchain", 4, "CSE-C"
    ),
    (
        "High-Frequency Algorithmic Market Manipulation Detection Using L2 Order Book Telemetry",
        "Recurrent neural network identifying spoofing, quote stuffing, and layering manipulation patterns in nanosecond financial order streams.",
        "Predatory high-frequency trading algorithms manipulate financial order books to fleece retail investor orders before human regulators can intervene.",
        "Data Analytics & Finance", 4, "CSE-C"
    ),
    (
        "Autonomous Quadcopter for High-Rise Building Window Facade Cleaning",
        "Tethered drone with ducted fans and pressure nozzles maintaining stable wall distance to wash glass skyscraper facades.",
        "Skyscraper window cleaners face grave occupational risks hanging from external scaffolding hundreds of feet in the air.",
        "Robotics & Safety", 4, "CSE-C"
    ),
    (
        "Edge-Computing Seizure Alert Earbud with Photoplethysmography and Accelerometry",
        "In-ear wearable sensor detecting autonomic arousal spikes and clonic motor movements to alert caregivers before nocturnal status epilepticus.",
        "Nocturnal epileptic seizures frequently go unnoticed by sleeping family members, causing sudden unexpected death in epilepsy (SUDEP).",
        "Healthcare Technology", 4, "CSE-C"
    ),
    (
        "Automated Microgrid Islanding and Black-Start Restoration Controller",
        "Distributed agent network managing instantaneous disconnect from failing national grid and black-starting diesel and battery micro-generators.",
        "Grid blackouts cascade across critical regional hospitals when local backup generation cannot synchronize frequency and island safely.",
        "Energy Systems & IoT", 4, "CSE-C"
    ),
    (
        "Speech Enhancement Pipeline for Cochlear Implant Users in High-Noise Environments",
        "Generative adversarial speech denoiser isolating target human voices from cocktail party background noise for multi-channel implants.",
        "Cochlear implant recipients struggle to comprehend spoken conversations in noisy cafeteria environments due to poor spectral resolution.",
        "Accessibility & Audio AI", 4, "CSE-C"
    ),
    (
        "Autonomous Forest Canopy Rover for Micro-Climatological Sensor Deployment",
        "Tree-climbing cable rover navigating upper forest canopy layers to install solar environmental telemetry probes.",
        "Scientists cannot gather micro-climate data from tropical forest canopies because manual tree-climbing is perilous and time-consuming.",
        "Environmental & Robotics", 4, "CSE-C"
    ),

    # =========================================================================
    # FOURTH YEAR — SECTION CSE-D (24 projects: slots 2 to 25; slot 1 was existing)
    # =========================================================================
    (
        "Autonomous Aerial System for Remote Wildfire Spot Detection and Retardant Drop",
        "Heavy-lift autonomous fixed-wing drone identifying thermal wildfire ignition vectors and coordinating precision chemical retardant drops.",
        "Wildfire response teams face hazardous conditions flying manned aircraft through low-visibility smoke corridors at low altitudes.",
        "Robotics & Disaster Mgmt", 4, "CSE-D"
    ),
    (
        "Zero-Knowledge Proof of Solvency for Cryptocurrency Custodial Exchanges",
        "Merkle sum-tree verification allowing crypto exchange depositors to verify that the exchange holds 100% reserves without exposing balances.",
        "Cryptocurrency exchange collapses destroy billions in retail investor assets due to hidden fractional reserve practices.",
        "Blockchain & Cryptography", 4, "CSE-D"
    ),
    (
        "Deep Learning Automated Whole-Body PET/CT Lymphoma Staging and Response Assessment",
        "Attention-guided convolutional 3D architecture segmenting hypermetabolic lymph nodes and calculating total metabolic tumor volume.",
        "Oncologists manually reviewing PET/CT scans take hours to contour metastatic lymphoma lesions to assess chemotherapy effectiveness.",
        "Healthcare Technology", 4, "CSE-D"
    ),
    (
        "Automated Source-Code Memory Safety Transformation to Rust",
        "Static analysis and abstract syntax tree refactoring engine translating legacy vulnerable C/C++ libraries into memory-safe Rust.",
        "Over 70% of all software security vulnerabilities in major operating systems stem from memory safety bugs like buffer overflows and use-after-free.",
        "Developer Tools & Security", 4, "CSE-D"
    ),
    (
        "Autonomous Underwater Vehicle Swarm for Marine Microplastic Mapping",
        "Fleet of underwater sensor gliders using optical fluorometry to quantify microplastic particle concentrations at various ocean depths.",
        "Marine plastic pollution is primarily concentrated below the surface where satellite remote sensing cannot measure ecological damage.",
        "Environmental Sustainability", 4, "CSE-D"
    ),
    (
        "Hardware-Accelerated Zero-Trust Packet Filtering for 100Gbps Cloud Gateways",
        "SmartNIC FPGA architecture enforcing stateful microsegmentation policies at wire speed without consuming host CPU cycles.",
        "Software firewalls cannot inspect network packets at 100Gbps speeds, forcing cloud providers to trade security for network throughput.",
        "Cybersecurity & Hardware", 4, "CSE-D"
    ),
    (
        "Autonomous Quadruped Robot for Underground Mine Tunnel Structural Inspection",
        "Legged robot with 3D LiDAR mapping rock fissures and detecting toxic methane gas concentrations in abandoned mine shafts.",
        "Underground mine workers are exposed to deadly structural cave-ins and toxic methane explosions when inspecting aging tunnels.",
        "Robotics & Industrial Safety", 4, "CSE-D"
    ),
    (
        "Federated Learning on Edge Micro-Nodes for Privacy-Preserving Smart Meter Analytics",
        "Decentralized machine learning training household energy consumption models without transmitting private interval load profiles to utilities.",
        "Smart meter load profiles reveal household occupancy, television viewing habits, and personal routines, creating severe privacy concerns.",
        "Data Analytics & Privacy", 4, "CSE-D"
    ),
    (
        "Early Sepsis Prediction in Neonatal Intensive Care Units (NICU) Using Multimodal AI",
        "Deep learning model combining non-invasive vitals with clinical notes to detect late-onset neonatal sepsis 8 hours before blood cultures.",
        "Premature neonates can succumb to septic shock within hours, yet diagnostic blood culture results take up to 48 hours to confirm bacterial growth.",
        "Healthcare Technology", 4, "CSE-D"
    ),
    (
        "Decentralized Self-Sovereign Identity Architecture for Displaced Refugees",
        "W3C decentralized identifier wallet allowing displaced populations to prove identity and educational credentials without home government papers.",
        "Refugees fleeing warzones lose physical identity papers, leaving them unable to access healthcare, banking, or legal asylum procedures.",
        "Accessibility & Social Impact", 4, "CSE-D"
    ),
    (
        "Autonomous Agricultural Rover for Laser Micro-Pruning of Vineyards",
        "Computer vision rover identifying dormant grape cane buds and firing calibrated carbon dioxide lasers to prune shoots without manual labor.",
        "Vineyards face severe skilled labor shortages during winter pruning seasons, directly impacting grape yields and winery viability.",
        "Agriculture & Robotics", 4, "CSE-D"
    ),
    (
        "Automated Malware Threat Deobfuscation Using Symbolic Execution and Neuro-Compilation",
        "Reverse engineering pipeline recovering original control flow graphs from heavily packed and virtualized binary malware samples.",
        "Sophisticated threat actors use custom software packers and control flow flattening to bypass automated reverse engineering sandboxes.",
        "Cybersecurity", 4, "CSE-D"
    ),
    (
        "Autonomous Satellite Constellation Orbit Collision Avoidance via Distributed MARL",
        "Multi-agent reinforcement learning policy orchestrating orbital thruster burns to avoid space debris collisions in low Earth orbit.",
        "Tens of thousands of newly launched commercial satellites create catastrophic Kessler syndrome space debris collision risks.",
        "Aerospace & AI", 4, "CSE-D"
    ),
    (
        "Deep Learning Automated Diabetic Foot Ulcer Infection Staging and Tissue Composition",
        "Mobile multi-spectral camera application segmenting granulation, slough, and necrotic tissue to guide clinical debridement.",
        "Diabetic foot ulcers lead to preventable lower-limb amputations when clinical infection spread is not identified early.",
        "Healthcare Technology", 4, "CSE-D"
    ),
    (
        "Decentralized Privacy-Preserving Proof of Vaccination for Global Travel",
        "Zero-knowledge credential verifying authentic vaccination records across international airport gates without revealing patient health histories.",
        "Paper vaccination cards and unencrypted QR passes reveal full patient medical identities to third-party border control inspectors.",
        "Blockchain & Healthcare", 4, "CSE-D"
    ),
    (
        "Autonomous Offshore Wave Energy Harvester Grid Synchronization Controller",
        "Buoy telemetry module regulating power takeoff hydraulics and synchronizing oscillating electrical power to subsea grid cables.",
        "Ocean wave energy converters experience erratic electrical frequency swings that cause damage when connected directly to utility grids.",
        "Environmental Sustainability", 4, "CSE-D"
    ),
    (
        "Automated Detection of Malicious Insider Threat Exfiltration Using User Entity Behavior Analytics",
        "Isolation forest and recurrent autoencoder pipeline detecting unauthorized sensitive data staging and abnormal USB transfers.",
        "Disgruntled employees exfiltrate proprietary source code and customer databases over months using authorized system credentials.",
        "Cybersecurity", 4, "CSE-D"
    ),
    (
        "Autonomous Robotic System for Deep-Sea Hydrothermal Vent Ecological Sampling",
        "Titanium robotic arm with temperature-controlled vacuum chambers gathering extremophile bacterial samples from 3,000-meter vents.",
        "Biological research into ocean hydrothermal vent ecosystems is limited by the scarcity and high cost of manned deep-sea submersibles.",
        "Robotics & Marine Science", 4, "CSE-D"
    ),
    (
        "Automated MRI Motion Artifact Correction via Dual-Domain Deep Learning",
        "K-space and image-domain neural network removing motion blurring from pediatric MRI scans without requiring conscious sedation.",
        "Pediatric patients fidget during long MRI scans, creating blurred images that force radiologists to order risky conscious sedation scans.",
        "Healthcare Technology", 4, "CSE-D"
    ),
    (
        "High-Throughput Privacy-Preserving DNA Sequence Alignment via Secure Enclaves",
        "Cloud genome analysis pipeline running Bowtie alignment and variant calling inside AMD SEV hardware-encrypted memory VMs.",
        "Commercial cloud sequencing pipelines expose sensitive personal genetic blueprints to host infrastructure operators.",
        "Bioinformatics & Security", 4, "CSE-D"
    ),
    (
        "Autonomous Swarm Rover Architecture for Planetary Regolith Excavation",
        "Decentralized team of autonomous wheeled rovers excavating and transporting simulated lunar regolith for in-situ resource utilization.",
        "Lunar and Martian exploration missions require lightweight robotic excavator fleets that can operate autonomously during Earth communication blackouts.",
        "Aerospace & Robotics", 4, "CSE-D"
    ),
    (
        "AI-Driven Predictive Seismic Liquefaction Mapping for Urban Infrastructure",
        "Geotechnical neural network combining soil borehole data and seismic ground motion simulations to predict liquefaction settlement.",
        "Earthquake ground liquefaction causes multistory buildings to topple intact, yet geotechnical engineers lack automated spatial risk maps.",
        "Disaster Management", 4, "CSE-D"
    ),
    (
        "Autonomous Micro-Grid Blackout Defense System via Decentralized Frequency Droop Control",
        "Inverter telemetry controller stabilizing regional microgrids by shedding non-critical industrial loads within 16 milliseconds.",
        "Modern power grids with high solar penetration lose inertia, leading to rapid frequency collapse when large generators trip offline.",
        "Energy Systems & IoT", 4, "CSE-D"
    ),
    (
        "Smart Assistive Cane with LiDAR and Haptic Navigation for the Visually Impaired",
        "Lightweight smart cane featuring micro-LiDAR scanning for chest-height obstacles, overhanging tree branches, and drop-offs.",
        "Traditional white canes only detect ground obstacles, leaving visually impaired users vulnerable to painful head and chest collisions.",
        "Accessibility & Social Impact", 4, "CSE-D"
    ),
]
