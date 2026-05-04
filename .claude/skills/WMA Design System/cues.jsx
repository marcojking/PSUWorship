// Subtitle cues — regrouped from "Subtitle 1.srt" into readable phrases.
// Times are in seconds, relative to the start of the audio (originally 01:00:00).
// Tokens with em:true render in Cormorant italic + rust (#b45741).
// All divine pronouns (He / Him / His) are capitalized.
//
// Each cue: { start, end, tokens: [ {t, em?, sm?} ] }
//   - em: emphasis (Cormorant italic, rust)
//   - sm: small (slightly smaller — for less-important connector phrases)

const CUES = [
  // 0:00.458 → 0:02.583  "So we started Worship Music and Arts Club,"
  { start: 0.458, end: 2.583, tokens: [
    { t: "So we started " },
    { t: "Worship Music & Arts Club", brand: true },
    { t: "," },
  ]},

  // 0:02.916 → 0:05.041  "formerly PSU Worship, to give"
  { start: 2.916, end: 5.041, tokens: [
    { t: "formerly " },
    { t: "PSU Worship", brand: true },
    { t: ", to give" },
  ]},

  // 0:05.041 → 0:07.875  "students a space to worship God and to invite"
  { start: 5.041, end: 7.875, tokens: [
    { t: "students a space to worship " },
    { t: "God", em: true },
    { t: " and to invite" },
  ]},

  // 0:07.875 → 0:11.041  "others in to the beauty and joy of who He is."
  { start: 7.875, end: 11.041, tokens: [
    { t: "others in to the beauty and joy of who " },
    { t: "He", em: true },
    { t: " is." },
  ]},

  // 0:11.583 → 0:14.541  "Next semester, we're talking with artists like"
  { start: 11.583, end: 14.541, tokens: [
    { t: "Next semester, we're talking with artists like" },
  ]},

  // 0:14.541 → 0:17.833  "Pat Barrett and Caleb King about coming here to"
  { start: 14.541, end: 17.833, tokens: [
    { t: "Pat Barrett", brand: true },
    { t: " and " },
    { t: "Caleb King", brand: true },
    { t: " about coming here to" },
  ]},

  // 0:17.833 → 0:20.125  "our campus to worship together, encourage each other,"
  { start: 17.833, end: 20.125, tokens: [
    { t: "our campus to worship together, encourage each other," },
  ]},

  // 0:20.125 → 0:22.625  "and just build up the body of Christ here at Penn State."
  { start: 20.125, end: 22.625, tokens: [
    { t: "and just build up the body of " },
    { t: "Christ", em: true },
    { t: " here at " },
    { t: "Penn State", brand: true },
    { t: "." },
  ]},

  // 0:23.291 → 0:26.375  "Our student band of Gentle and Lowly is about to"
  { start: 23.291, end: 26.375, tokens: [
    { t: "Our student band " },
    { t: "Gentle & Lowly", brand: true },
    { t: " is about to" },
  ]},

  // 0:26.375 → 0:28.250  "release our first three-song EP."
  { start: 26.375, end: 28.250, tokens: [
    { t: "release our first three-song EP." },
  ]},

  // 0:28.791 → 0:31.333  "It's fully written and recorded by students here."
  { start: 28.791, end: 31.333, tokens: [
    { t: "It's fully written and recorded by students here." },
  ]},

  // 0:31.625 → 0:36.333  "And we plan to continue to write, record, and release music together in the following semesters."
  { start: 31.625, end: 36.333, tokens: [
    { t: "And we plan to continue to write, record, and release music together in the following semesters." },
  ]},

  // 0:37.125 → 0:40.166  "Man, God is just doing so much here"
  { start: 37.125, end: 40.166, tokens: [
    { t: "Man, " },
    { t: "God", em: true },
    { t: " is just doing so much here" },
  ]},

  // 0:39.458 → 0:40.583  "through music."  -- overlaps slightly; nudge start
  { start: 40.250, end: 40.900, tokens: [
    { t: "through music." },
  ]},

  // 0:40.583 → 0:43.583  "And if you're a student here and want to be a part of that,"
  { start: 40.900, end: 43.583, tokens: [
    { t: "And if you're a student here and want to be a part of that," },
  ]},

  // 0:43.583 → 0:46.208  "we'd encourage you to think and pray about becoming"
  { start: 43.583, end: 46.208, tokens: [
    { t: "we'd encourage you to think and pray about becoming" },
  ]},

  // 0:46.208 → 0:48.500  "involved in Worship Music & Arts Club."
  { start: 46.208, end: 48.700, tokens: [
    { t: "involved in " },
    { t: "Worship Music & Arts Club", brand: true },
    { t: "." },
  ]},

  // 0:48.000 → 0:52.750  "We have a leadership and team application at the end of this video."
  { start: 48.900, end: 52.750, tokens: [
    { t: "We have a leadership and team application at the end of this video." },
  ]},

  // 0:53.250 → 0:56.666  "We've just been so encouraged by what God is doing here at"
  { start: 53.250, end: 56.666, tokens: [
    { t: "We've just been so encouraged by what " },
    { t: "God", em: true },
    { t: " is doing here at" },
  ]},

  // 0:56.250 → 0:56.666  "Penn State."
  { start: 56.700, end: 57.700, tokens: [
    { t: "Penn State", brand: true },
    { t: "." },
  ]},

  // 0:57.000 → 1:00.458  "And we know that He doesn't need us, but He wants"
  { start: 57.700, end: 60.458, tokens: [
    { t: "And we know that " },
    { t: "He", em: true },
    { t: " doesn't need us, but " },
    { t: "He", em: true },
    { t: " wants" },
  ]},

  // 1:00.458 → 1:01.291  "us to be a part of what He's doing."
  { start: 60.458, end: 62.500, tokens: [
    { t: "us to be a part of what " },
    { t: "He's", em: true },
    { t: " doing." },
  ]},

  // 1:02.041 → 1:04.708  "So let's all just lean into that together"
  { start: 62.700, end: 65.000, tokens: [
    { t: "So let's all just lean into that together" },
  ]},

  // 1:04.708 → 1:06.625  "and just continue to bring all the glory to Jesus."
  { start: 65.000, end: 67.500, tokens: [
    { t: "and just continue to bring all the glory to " },
    { t: "Jesus", em: true },
    { t: "." },
  ]},
];

window.CUES = CUES;
window.CUES_DURATION = 68.5;
