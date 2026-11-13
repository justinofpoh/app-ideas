// The idea library. Every idea is a structured object so search, filters,
// similarity, the universe and synthesis can all read the same fields.
// All entries are original concepts written for App Idea Store.

export type Category =
  | 'Productivity'
  | 'Health'
  | 'Finance'
  | 'Lifestyle'
  | 'Education'
  | 'Utilities'
  | 'Creativity'
  | 'Social'

export type Effort = 'Weekend' | 'Month' | 'Quarter'
export type Model = 'Subscription' | 'One-time' | 'Freemium' | 'B2B SaaS'

export interface Idea {
  id: string
  title: string
  pitch: string
  category: Category
  audience: string
  problem: string
  job: string // the job-to-be-done: "steal the job, not the app"
  features: string[]
  tech: string[]
  platforms: string[]
  effort: Effort
  model: Model
  ai: boolean
  microSaas: boolean
}

type Raw = [
  title: string,
  pitch: string,
  category: Category,
  audience: string,
  problem: string,
  job: string,
  features: string[],
  tech: string[],
  platforms: string[],
  effort: Effort,
  model: Model,
]

const AI_TECH = new Set(['On-device AI', 'LLM', 'Vision', 'Speech'])

const raw: Raw[] = [
  // Productivity
  ['Focus Garden', 'Grow a small garden by finishing deep-work sessions.', 'Productivity', 'Students and remote workers', 'Pomodoro timers feel like punishment, so people stop using them.', 'Make me want to start the next focus block', ['Plants grow only while a session runs', 'Seasons unlock after streaks', 'Focus filter turns on automatically'], ['Live Activities', 'Shortcuts', 'Widgets'], ['iOS', 'Mac'], 'Month', 'Freemium'],
  ['Inbox Weather', 'A morning forecast of what your inbox and calendar will demand today.', 'Productivity', 'Managers with packed calendars', 'Mornings start reactive because nobody sees the day’s load at a glance.', 'Tell me how heavy today is before I open anything', ['Load score from meetings and threads', 'Suggests one block to protect', 'Lock-screen forecast widget'], ['LLM', 'Calendar', 'Widgets'], ['iOS', 'Mac'], 'Month', 'Subscription'],
  ['Meeting Residue', 'Turns meeting audio into the three decisions and who owns them.', 'Productivity', 'Small startup teams', 'Notes capture everything said but not what was decided.', 'Remind me what we agreed and who does it', ['On-device transcription', 'Decision and owner extraction', 'Sends owners a nudge in 3 days'], ['Speech', 'On-device AI', 'Notifications'], ['iOS', 'Mac'], 'Quarter', 'Subscription'],
  ['Someday Shelf', 'A calm place for ideas you are not doing yet, resurfaced at the right moment.', 'Productivity', 'People with long backlogs', 'Task apps turn “maybe later” into guilt.', 'Hold this thought without nagging me', ['Ideas fade back in on a schedule you set', 'Archive with one swipe', 'Share sheet capture'], ['Shortcuts', 'CloudKit', 'Notifications'], ['iOS', 'Mac'], 'Weekend', 'One-time'],
  ['Handoff Notes', 'A shift-change log for teams that work in rotations.', 'Productivity', 'Clinic, café and support teams', 'Context gets lost every time a shift ends.', 'Tell the next person what they need to know', ['Templates per role', 'Unread handoffs pin to the top', 'Voice note to text'], ['Speech', 'Sync', 'Notifications'], ['iOS', 'Web'], 'Month', 'B2B SaaS'],
  ['Two Minute Rule', 'Catches tiny tasks and clears them in a single timed sprint.', 'Productivity', 'Busy parents and freelancers', 'Small tasks pile up and drain attention all day.', 'Get the small stuff out of my head', ['Sprint mode with a countdown', 'Batches tasks by location', 'Done list you can share'], ['Live Activities', 'Location', 'Widgets'], ['iOS', 'watchOS'], 'Weekend', 'One-time'],
  ['Deep Link Desk', 'A launcher that opens the exact doc, board or file a task needs.', 'Productivity', 'Knowledge workers juggling many tools', 'Starting a task means hunting through five apps.', 'Drop me straight into the work', ['Links attached to tasks', 'Daily launch list', 'Keyboard-first on Mac'], ['Shortcuts', 'Sync'], ['Mac', 'iOS'], 'Month', 'Subscription'],
  ['Quiet Hours for Teams', 'Shared do-not-disturb windows across Slack, mail and calendar.', 'Productivity', 'Remote teams across time zones', 'People ping each other during focus time because nothing shows it.', 'Protect my focus without asking every person', ['Team-wide focus schedule', 'Status sync to chat tools', 'Weekly focus report'], ['Calendar', 'Web'], ['Web', 'Mac'], 'Quarter', 'B2B SaaS'],
  ['Weekly Review Coach', 'A guided 15-minute Friday review that ends with next week’s three priorities.', 'Productivity', 'Solo founders', 'Weeks blur together without a moment to look back.', 'Help me close the week and pick what matters', ['Pulls completed tasks and calendar', 'Prompts that change each week', 'Exports a one-page plan'], ['LLM', 'Calendar', 'Notifications'], ['iOS', 'Mac'], 'Month', 'Subscription'],
  ['Doc Diet', 'Shrinks long internal docs into a skimmable brief with open questions.', 'Productivity', 'Product teams', 'Specs are too long to read before the meeting about them.', 'Let me walk into the meeting prepared', ['Paste or share a doc', 'Brief plus open questions', 'Highlights changes since last read'], ['LLM', 'Web'], ['Web'], 'Weekend', 'B2B SaaS'],

  // Health
  ['Voice Journal', 'A journal that turns voice notes into personal reflections.', 'Health', 'People who want to journal but hate typing', 'Blank pages stop people from reflecting at all.', 'Help me notice how I have been feeling', ['Speak for a minute, get a reflection', 'Mood patterns over weeks', 'Everything stays on device'], ['Speech', 'On-device AI', 'HealthKit'], ['iOS'], 'Month', 'Subscription'],
  ['Sleep Debt Bank', 'Shows sleep as a running balance you pay back, not a nightly grade.', 'Health', 'Shift workers and new parents', 'Nightly sleep scores feel random and discouraging.', 'Tell me how far behind I am and how to recover', ['Running balance from HealthKit', 'Recovery plan for the weekend', 'Watch complication'], ['HealthKit', 'Apple Watch', 'Widgets'], ['iOS', 'watchOS'], 'Weekend', 'One-time'],
  ['Pill Pal Lite', 'Medication reminders that confirm with a tap on the watch.', 'Health', 'Older adults and caregivers', 'Missed doses go unnoticed by the people who care.', 'Make sure the dose happened', ['Watch tap to confirm', 'Caregiver gets missed-dose alerts', 'Refill countdown'], ['Apple Watch', 'Notifications', 'CloudKit'], ['iOS', 'watchOS'], 'Month', 'Freemium'],
  ['Posture Ping', 'Uses AirPods motion to nudge you when you slouch at the desk.', 'Health', 'Desk workers', 'Posture apps need extra hardware nobody buys.', 'Stop me slouching without thinking about it', ['Head-angle tracking via AirPods', 'Gentle haptic nudge', 'Daily posture timeline'], ['On-device AI', 'Notifications'], ['iOS', 'Mac'], 'Month', 'One-time'],
  ['Walk Prescription', 'Turns your step data into a short walk plan for today’s weather.', 'Health', 'People returning to exercise', 'Generic step goals ignore your week and the weather.', 'Give me a walk I will actually take', ['Route sized to your gap', 'Weather-aware timing', 'Streak that forgives bad days'], ['HealthKit', 'MapKit', 'Location'], ['iOS', 'watchOS'], 'Weekend', 'Freemium'],
  ['Symptom Diary', 'Log symptoms in seconds and bring a clean summary to the doctor.', 'Health', 'People managing chronic conditions', 'Patients forget details by the time of the appointment.', 'Help me explain what has been happening', ['Quick log from lock screen', 'Links to sleep and cycle data', 'PDF summary for appointments'], ['HealthKit', 'Widgets', 'LLM'], ['iOS'], 'Month', 'Subscription'],
  ['Breath Break', 'One-minute breathing sessions triggered by heart-rate spikes.', 'Health', 'Anxious professionals', 'People only remember to breathe after the stressful moment.', 'Catch me when I am tense', ['Heart-rate trigger on watch', 'Guided haptic breathing', 'Weekly calm report'], ['Apple Watch', 'HealthKit', 'Notifications'], ['watchOS', 'iOS'], 'Weekend', 'One-time'],
  ['Meal Snap Macro', 'Photograph a plate and get a rough macro estimate you can adjust.', 'Health', 'Gym-goers', 'Manual food logging takes too long to keep up.', 'Make logging food take seconds', ['Photo to macro estimate', 'Correct with sliders', 'Syncs to Health'], ['Vision', 'On-device AI', 'HealthKit'], ['iOS'], 'Quarter', 'Subscription'],
  ['Hydration Habit', 'A water tracker that learns your day and nudges before you are thirsty.', 'Health', 'Office workers', 'Hydration reminders fire at random and get muted.', 'Remind me at the moments I usually forget', ['Learns your routine', 'One-tap logging widget', 'Watch complication'], ['On-device AI', 'Widgets', 'Apple Watch'], ['iOS', 'watchOS'], 'Weekend', 'Freemium'],
  ['Rehab Reps', 'Counts physio exercises with the camera and tracks recovery.', 'Health', 'People recovering from injuries', 'Home exercises get skipped or done wrong.', 'Make sure I do my physio right', ['Pose detection counts reps', 'Form tips in real time', 'Progress report for the physio'], ['Vision', 'Camera', 'On-device AI'], ['iOS'], 'Quarter', 'Subscription'],

  // Finance
  ['Subscription Radar', 'Track forgotten subscriptions and upcoming renewals.', 'Finance', 'Anyone with more than five subscriptions', 'Free trials quietly turn into charges.', 'Warn me before I pay for something I forgot', ['Scan receipts in mail', 'Renewal countdown widget', 'One-tap cancel guides'], ['Notifications', 'Widgets', 'LLM'], ['iOS'], 'Month', 'Freemium'],
  ['Receipt Split', 'Split group receipts automatically from a photo.', 'Finance', 'Friends who eat out together', 'Splitting a bill line by line is slow and awkward.', 'Settle the bill without the spreadsheet', ['Photo to line items', 'Drag items to people', 'Payment links per person'], ['Vision', 'Camera', 'Payments'], ['iOS'], 'Month', 'Freemium'],
  ['Envelope Budget', 'Digital cash envelopes that refill on payday.', 'Finance', 'People who budget with cash', 'Budget apps are spreadsheets in disguise.', 'Show me what I can still spend', ['Envelopes refill on payday', 'Spend from widget', 'Shared envelopes for couples'], ['Widgets', 'CloudKit', 'Open Banking'], ['iOS'], 'Month', 'Subscription'],
  ['Freelancer Tax Jar', 'Sets aside a tax percentage every time a client pays you.', 'Finance', 'Freelancers', 'Tax bills surprise freelancers every year.', 'Make sure I am never short at tax time', ['Detects incoming client payments', 'Suggests how much to move', 'Quarterly estimate'], ['Open Banking', 'Notifications'], ['iOS', 'Web'], 'Quarter', 'Subscription'],
  ['Price Memory', 'Remembers what you paid last time for the things you buy often.', 'Finance', 'Grocery shoppers', 'People cannot tell if a price is good or not.', 'Tell me if this is a good price', ['Scan shelf tags', 'Price history per item', 'Alerts for your usual store'], ['Vision', 'Camera', 'Location'], ['iOS'], 'Month', 'Freemium'],
  ['Nomad Money', 'A wallet view that converts every balance and spend into your home currency.', 'Finance', 'Digital nomads', 'Multi-currency spending makes budgets meaningless.', 'Show me what I really spent this month', ['Live FX for every account', 'Spend by country', 'Visa-run cost planner'], ['Open Banking', 'Location', 'Widgets'], ['iOS', 'Web'], 'Month', 'Subscription'],
  ['Bill Calendar', 'All your bills on one calendar with a safe-to-spend line.', 'Finance', 'Young professionals', 'Bills land on different days and drain the account unexpectedly.', 'Tell me what is coming out before payday', ['Bill timeline', 'Safe-to-spend balance', 'Calendar sync'], ['Calendar', 'Open Banking', 'Widgets'], ['iOS'], 'Weekend', 'Freemium'],
  ['Invoice Chaser', 'Polite automatic follow-ups on unpaid invoices.', 'Finance', 'Agencies and freelancers', 'Chasing payments is awkward and easy to postpone.', 'Get me paid without the awkward emails', ['Reminder sequences', 'Tone you can approve', 'Paid status from bank'], ['LLM', 'Web', 'Payments'], ['Web'], 'Month', 'B2B SaaS'],
  ['Allowance Jar', 'Chores, pocket money and savings goals for families.', 'Finance', 'Parents of young kids', 'Kids never see money move, so saving feels abstract.', 'Teach my kid that money is earned and saved', ['Chores earn coins', 'Goals with pictures', 'Parent approval'], ['CloudKit', 'Widgets', 'Notifications'], ['iOS'], 'Month', 'Subscription'],
  ['Spend Mood', 'Links spending to how you felt so you can spot emotional purchases.', 'Finance', 'Impulse spenders', 'People do not notice what triggers their spending.', 'Show me why I overspend', ['Quick mood tag on each spend', 'Pattern report', 'Pause rule before big buys'], ['On-device AI', 'Open Banking', 'Notifications'], ['iOS'], 'Month', 'Subscription'],

  // Lifestyle
  ['Shelf Scan', 'Scan household items to create a searchable inventory.', 'Lifestyle', 'Families and renters', 'People rebuy things they already own because they cannot find them.', 'Tell me where it is and whether I have it', ['Photo scan by room', 'Search by object', 'Moving-box labels'], ['Vision', 'Camera', 'CloudKit'], ['iOS'], 'Month', 'Freemium'],
  ['Plant Doctor Lite', 'Snap a leaf, get a likely issue and a care plan.', 'Lifestyle', 'New plant owners', 'Plants die before owners figure out what is wrong.', 'Keep my plants alive', ['Leaf photo diagnosis', 'Watering schedule', 'Light check with camera'], ['Vision', 'On-device AI', 'Notifications'], ['iOS'], 'Month', 'Freemium'],
  ['Wardrobe Rotation', 'Logs what you wear and suggests forgotten pieces.', 'Lifestyle', 'People with full closets', 'A small set of clothes gets all the wear.', 'Help me use what I already own', ['Outfit photo log', 'Forgotten-piece nudges', 'Weather-aware picks'], ['Vision', 'Camera', 'Widgets'], ['iOS'], 'Month', 'Subscription'],
  ['Fridge Countdown', 'Tracks what is in the fridge and what expires first.', 'Lifestyle', 'Households that waste food', 'Food expires at the back of the fridge.', 'Use it before it goes off', ['Receipt scan adds items', 'Expiry countdown', 'Recipes from what is left'], ['Vision', 'LLM', 'Notifications'], ['iOS'], 'Month', 'Freemium'],
  ['Neighborhood Swap', 'Lend and borrow tools with people on your street.', 'Lifestyle', 'Homeowners', 'People buy tools they use once.', 'Let me borrow instead of buy', ['Map of nearby items', 'Lending reminders', 'Trust badges'], ['MapKit', 'Location', 'Notifications'], ['iOS'], 'Quarter', 'Freemium'],
  ['Coworking Finder Bali', 'Live wifi speed, power and vibe for cafés where you can work.', 'Lifestyle', 'Remote workers abroad', 'Reviews never mention wifi or power outlets.', 'Find a place I can actually work from today', ['Speed tests from visitors', 'Outlet map', 'Crowd level by hour'], ['MapKit', 'Location', 'Web'], ['iOS', 'Web'], 'Month', 'Freemium'],
  ['Pet Routine', 'Shared feeding and walk log so pets are never fed twice.', 'Lifestyle', 'Households with pets', 'Family members double-feed or forget walks.', 'Know if the dog has eaten', ['Tap to log feed or walk', 'Shared family view', 'Vet reminder'], ['CloudKit', 'Widgets', 'Apple Watch'], ['iOS', 'watchOS'], 'Weekend', 'One-time'],
  ['Travel Pack List', 'Packing lists that adapt to weather, trip length and activities.', 'Lifestyle', 'Frequent travellers', 'People forget the same things every trip.', 'Make sure I do not forget anything', ['Lists from trip details', 'Learns what you forgot', 'Shared lists for groups'], ['LLM', 'Location', 'CloudKit'], ['iOS'], 'Weekend', 'Freemium'],
  ['Home Maintenance Clock', 'Reminders for filters, boilers and the jobs nobody remembers.', 'Lifestyle', 'First-time homeowners', 'Maintenance gets missed until something breaks.', 'Remind me before things break', ['Home profile setup', 'Seasonal task list', 'Pro contacts per task'], ['Notifications', 'Calendar'], ['iOS'], 'Weekend', 'Subscription'],
  ['Gift Ledger', 'Remembers what you gave and what people mentioned wanting.', 'Lifestyle', 'Thoughtful gift givers', 'Good gift ideas come months before the birthday and get lost.', 'Help me give a gift that lands', ['Quick note per person', 'Birthday countdown', 'Budget per occasion'], ['Notifications', 'Calendar', 'Shortcuts'], ['iOS'], 'Weekend', 'One-time'],

  // Education
  ['Micro Coach', 'Five-minute personalized lessons for learning new skills.', 'Education', 'Busy adults', 'Courses assume hours of free time.', 'Teach me something useful while the kettle boils', ['Lessons sized to five minutes', 'Adapts to answers', 'Lock-screen recap'], ['LLM', 'Widgets', 'Notifications'], ['iOS'], 'Month', 'Subscription'],
  ['Swift Kata', 'Daily bite-size SwiftUI challenges with a live preview.', 'Education', 'Aspiring iOS developers', 'Tutorials are passive and skills do not stick.', 'Make me better at SwiftUI every day', ['One challenge a day', 'Live preview playground', 'Streak and solutions'], ['On-device AI', 'Widgets'], ['iOS', 'Mac'], 'Quarter', 'Subscription'],
  ['Menu Reader', 'Point the camera at a foreign menu and learn the words as you order.', 'Education', 'Travellers learning a language', 'Translation apps translate but teach nothing.', 'Help me order and learn at the same time', ['Live menu translation', 'Saves new words', 'Review cards later'], ['Vision', 'Camera', 'On-device AI'], ['iOS'], 'Month', 'Freemium'],
  ['Explain Like Lecture', 'Records a lecture and builds flashcards from what the teacher stressed.', 'Education', 'University students', 'Students re-listen to whole lectures before exams.', 'Turn the lecture into what I need to revise', ['Records and transcribes', 'Flashcards from emphasis', 'Spaced review'], ['Speech', 'LLM', 'Notifications'], ['iOS', 'Mac'], 'Quarter', 'Subscription'],
  ['Kid Reading Buddy', 'Listens to children read aloud and helps with tricky words.', 'Education', 'Parents of early readers', 'Parents cannot always sit through reading practice.', 'Help my kid practise reading without me', ['Speech recognition per word', 'Gentle hints', 'Parent progress report'], ['Speech', 'On-device AI'], ['iOS'], 'Quarter', 'Subscription'],
  ['Pitch Practice', 'Rehearse a talk and get feedback on pace, filler words and clarity.', 'Education', 'Founders and students', 'People only get feedback after the real presentation.', 'Make me confident before I present', ['Pace and filler detection', 'Slide timing', 'Replays with markers'], ['Speech', 'LLM'], ['iOS', 'Mac'], 'Month', 'Subscription'],
  ['Math Snap Steps', 'Shows the next step of a problem, not the answer.', 'Education', 'High-school students and parents', 'Answer apps let kids skip the thinking.', 'Help me get unstuck without cheating', ['Photo of the problem', 'Reveals one step at a time', 'Parent mode'], ['Vision', 'LLM', 'Camera'], ['iOS'], 'Quarter', 'Freemium'],
  ['Vocabulary in the Wild', 'Collect words from signs and books with the camera and review later.', 'Education', 'Language learners abroad', 'Words seen on the street are forgotten immediately.', 'Help me keep the words I come across', ['Tap a word in the camera', 'Context photo saved', 'Spaced review'], ['Vision', 'Camera', 'Widgets'], ['iOS'], 'Month', 'Freemium'],
  ['Course Cohort', 'Small accountability pods for people taking the same online course.', 'Education', 'Online learners', 'Most online courses are abandoned in the first weeks.', 'Keep me going until I finish', ['Matched pods of five', 'Weekly check-ins', 'Shared progress board'], ['Notifications', 'Web', 'Sync'], ['Web', 'iOS'], 'Month', 'B2B SaaS'],

  // Utilities
  ['Screenshot Sorter', 'Sorts screenshots into receipts, codes, recipes and memes.', 'Utilities', 'Heavy screenshotters', 'Camera rolls fill with screenshots nobody can find.', 'Find that screenshot I took last week', ['Auto categories', 'Text search inside images', 'Bulk clean-up'], ['Vision', 'On-device AI', 'Shortcuts'], ['iOS'], 'Month', 'One-time'],
  ['Cable Matchmaker', 'Point the camera at a port and find the cable you need.', 'Utilities', 'People with drawers of cables', 'Nobody knows which cable fits which device.', 'Tell me which cable this needs', ['Port recognition', 'Cable drawer inventory', 'Buy links'], ['Vision', 'Camera'], ['iOS'], 'Weekend', 'Freemium'],
  ['Wifi Passport', 'Saves and shares wifi passwords per place, with a QR card.', 'Utilities', 'Hosts and nomads', 'Sharing wifi with guests means spelling passwords.', 'Get guests online in a second', ['QR card per network', 'Place-based list', 'NFC tag writer'], ['NFC', 'Location', 'Widgets'], ['iOS'], 'Weekend', 'One-time'],
  ['Warranty Vault', 'Stores receipts and warranties and reminds you before they expire.', 'Utilities', 'Homeowners', 'Warranty claims fail because receipts are lost.', 'Help me claim what I am owed', ['Receipt scan', 'Expiry reminders', 'Claim checklist'], ['Vision', 'CloudKit', 'Notifications'], ['iOS'], 'Weekend', 'Freemium'],
  ['Clipboard Timeline', 'A searchable history of everything you copied across devices.', 'Utilities', 'Developers and writers', 'Copied text disappears after the next copy.', 'Get back that thing I copied earlier', ['Clipboard history', 'Pinned snippets', 'Cross-device sync'], ['Sync', 'Shortcuts'], ['Mac', 'iOS'], 'Weekend', 'One-time'],
  ['Parking Pin', 'Remembers where you parked and when the meter runs out.', 'Utilities', 'City drivers', 'People forget where they parked and get fines.', 'Get me back to my car on time', ['Auto pin on disconnect', 'Meter Live Activity', 'Photo of the spot'], ['Location', 'Live Activities', 'MapKit'], ['iOS', 'watchOS'], 'Weekend', 'One-time'],
  ['Document Expiry', 'Tracks passports, visas and licences and warns months ahead.', 'Utilities', 'Expats and nomads', 'Expired documents ruin trips.', 'Never let a document expire on me', ['Scan document dates', 'Visa-run planner', 'Family profiles'], ['Vision', 'Notifications', 'Calendar'], ['iOS'], 'Weekend', 'Freemium'],
  ['Shortcut Store', 'A curated gallery of Shortcuts that solve one job each.', 'Utilities', 'iPhone power users', 'Shortcuts are powerful but hard to discover.', 'Give me automations that just work', ['One-tap install', 'Job-based collections', 'Request a shortcut'], ['Shortcuts', 'Web'], ['iOS', 'Web'], 'Month', 'Freemium'],
  ['Battery Story', 'Explains which apps and habits drain your battery this week.', 'Utilities', 'Everyday iPhone users', 'Battery settings show numbers without advice.', 'Make my battery last the day', ['Weekly drain story', 'One change to try', 'Charging habit tips'], ['On-device AI', 'Widgets'], ['iOS'], 'Month', 'One-time'],
  ['Quick Measure Room', 'Scan a room into a floor plan with measurements in a minute.', 'Utilities', 'Renters and movers', 'Measuring rooms by hand takes ages and is wrong.', 'Know if the sofa will fit', ['LiDAR room scan', 'Floor plan export', 'Furniture fit check'], ['Vision', 'Camera', 'Spatial'], ['iOS', 'visionOS'], 'Quarter', 'Freemium'],

  // Creativity
  ['Mood Board Pocket', 'Collect colours, textures and type from the world into boards.', 'Creativity', 'Designers', 'Inspiration spotted outside never reaches the design file.', 'Capture inspiration the moment I see it', ['Colour pick from camera', 'Font detection', 'Export to Figma'], ['Vision', 'Camera', 'Sync'], ['iOS', 'Mac'], 'Month', 'Subscription'],
  ['Song Sketch', 'Hum a melody and get it back as chords and a rough loop.', 'Creativity', 'Hobby musicians', 'Melodies vanish before you reach an instrument.', 'Keep the tune I just thought of', ['Hum to notes', 'Chord suggestions', 'Export MIDI'], ['Speech', 'On-device AI'], ['iOS'], 'Quarter', 'Subscription'],
  ['Story Seeds', 'Daily writing prompts built from your own photos.', 'Creativity', 'Writers with block', 'Generic prompts feel unrelated to your life.', 'Give me something real to write about', ['Prompt from a random photo', 'Timed sessions', 'Private archive'], ['LLM', 'Vision', 'Notifications'], ['iOS'], 'Weekend', 'Subscription'],
  ['App Icon Lab', 'Generate and test app icon variations on a real home screen.', 'Creativity', 'Indie iOS developers', 'Icons are judged in a design tool, not on a phone.', 'Show me how my icon looks among real apps', ['Home-screen previews', 'Light, dark and tinted modes', 'Export every size'], ['On-device AI', 'Widgets'], ['iOS', 'Mac', 'Web'], 'Month', 'One-time'],
  ['Comic Diary', 'Turns your day into a four-panel comic.', 'Creativity', 'People who like journaling visually', 'Journals feel like homework.', 'Make remembering my day fun', ['Describe your day', 'Four-panel output', 'Monthly book export'], ['LLM', 'On-device AI'], ['iOS'], 'Month', 'Subscription'],
  ['Photo Walk Missions', 'Photography challenges based on where you are right now.', 'Creativity', 'Phone photographers', 'People stop shooting because nothing feels new.', 'Give me a reason to shoot today', ['Location-based missions', 'Technique tips', 'Community gallery'], ['Location', 'Camera', 'MapKit'], ['iOS'], 'Month', 'Freemium'],
  ['Palette Weather', 'A daily colour palette from your city’s sky and light.', 'Creativity', 'Illustrators', 'Picking palettes from scratch is slow.', 'Hand me a palette with a story', ['Sky photo to palette', 'Widget of the day', 'Swatch export'], ['Vision', 'Widgets', 'Location'], ['iOS', 'Mac'], 'Weekend', 'One-time'],
  ['Thumbnail Tester', 'Preview video thumbnails in a fake feed before you publish.', 'Creativity', 'Video creators', 'Creators cannot tell which thumbnail stands out.', 'Pick the thumbnail people will click', ['Feed mockup', 'Side-by-side variants', 'Readability check'], ['Vision', 'Web'], ['Web', 'iOS'], 'Weekend', 'B2B SaaS'],
  ['Spatial Sketchbook', 'Sketch in 3D around you and walk through your drawing.', 'Creativity', 'Artists with Vision Pro', 'Spatial computing has few tools for making art.', 'Let me draw in the space around me', ['Hand-tracked brushes', 'Room anchoring', 'Export to video'], ['Spatial', 'Vision'], ['visionOS'], 'Quarter', 'One-time'],

  // Social
  ['Friend Orbit', 'Shows which friends you have not spoken to in a while.', 'Social', 'Adults whose friendships drift', 'Friendships fade without anyone deciding to stop.', 'Keep me close to people I care about', ['Orbit view by last contact', 'Gentle nudges', 'Notes per friend'], ['Notifications', 'Widgets', 'On-device AI'], ['iOS'], 'Weekend', 'One-time'],
  ['Dinner Roulette', 'Picks a restaurant the whole group can agree on.', 'Social', 'Friend groups', 'Group chats spend an hour deciding where to eat.', 'End the where-should-we-eat debate', ['Everyone swipes', 'Budget and diet filters', 'Booking link'], ['MapKit', 'Location', 'Web'], ['iOS', 'Web'], 'Month', 'Freemium'],
  ['Event Buddy', 'Find someone to go to a tech meetup with.', 'Social', 'Newcomers to a city', 'People skip events because they would go alone.', 'Give me someone to walk in with', ['Event list by interest', 'Match with attendees', 'Meet-at point'], ['Location', 'MapKit', 'Notifications'], ['iOS'], 'Quarter', 'Freemium'],
  ['Family Recipe Book', 'Collect family recipes with the voice of the person who cooks them.', 'Social', 'Families across generations', 'Family recipes disappear with the people who know them.', 'Keep grandma’s recipes alive', ['Voice notes per step', 'Photo of the handwritten card', 'Shared family book'], ['Speech', 'Vision', 'CloudKit'], ['iOS'], 'Month', 'Subscription'],
  ['Shared Wishlist', 'A wishlist friends can quietly claim items from.', 'Social', 'Birthday and holiday groups', 'People buy the same gift twice.', 'Avoid duplicate gifts', ['Add from any store', 'Secret claims', 'Price drop alerts'], ['Web', 'Notifications', 'Sync'], ['iOS', 'Web'], 'Weekend', 'Freemium'],
  ['Build in Public Log', 'A daily shipping log that formats itself for X and Threads.', 'Social', 'Indie hackers', 'Posting progress every day is a chore.', 'Share my progress without writing a post', ['Log wins in seconds', 'Weekly thread draft', 'Screenshot frames'], ['LLM', 'Shortcuts', 'Web'], ['iOS', 'Web'], 'Weekend', 'Subscription'],
  ['Club Organizer Lite', 'Run a running club or book club without a spreadsheet.', 'Social', 'Community organizers', 'Organizers juggle chats, sheets and payments.', 'Run my club from one place', ['RSVPs and waitlists', 'Dues collection', 'Attendance streaks'], ['Payments', 'Notifications', 'Calendar'], ['iOS', 'Web'], 'Month', 'B2B SaaS'],
  ['Postcard Drop', 'Send a real printed postcard from a phone photo.', 'Social', 'Travellers', 'Sending postcards abroad is a hassle.', 'Send something physical to someone I miss', ['Photo to printed card', 'Handwriting font', 'Address book'], ['Payments', 'Camera'], ['iOS'], 'Month', 'One-time'],
  ['Hangout Window', 'Finds overlapping free time between friends without sharing calendars.', 'Social', 'Busy friend groups', 'Scheduling a hangout takes days of messages.', 'Find a time we are all free', ['Private availability', 'Suggested slots', 'One-tap invite'], ['Calendar', 'Notifications'], ['iOS', 'Web'], 'Month', 'Freemium'],
]

const slug = (s: string) =>
  s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const IDEAS: Idea[] = raw.map(
  ([title, pitch, category, audience, problem, job, features, tech, platforms, effort, model]) => ({
    id: slug(title),
    title,
    pitch,
    category,
    audience,
    problem,
    job,
    features,
    tech,
    platforms,
    effort,
    model,
    ai: tech.some((t) => AI_TECH.has(t)),
    microSaas: model === 'B2B SaaS' || (platforms.includes('Web') && model === 'Subscription'),
  }),
)

export const BY_ID = new Map(IDEAS.map((i) => [i.id, i]))

export const CATEGORIES: Category[] = [
  'Productivity',
  'Health',
  'Finance',
  'Lifestyle',
  'Education',
  'Utilities',
  'Creativity',
  'Social',
]

// Each category gets a pigment, like a set of gouache inks on paper.
// Vermilion is kept for the brand (the "a") and for things that are yours.
export const CATEGORY_INK: Record<Category, string> = {
  Productivity: '#2f4fb3', // cobalt
  Health: '#4e7d4a', // moss
  Finance: '#b8821a', // ochre
  Lifestyle: '#c2456b', // rose madder
  Education: '#6b3f8e', // plum
  Utilities: '#4a6274', // slate
  Creativity: '#1f7f7a', // teal
  Social: '#8e2f45', // burgundy
}
