// Guest list + invite code rules for the personalised invite gate.
// -------------------------------------------------------------
// How it works:
// 1) Guest enters NAME + INVITE CODE
// 2) If match found in GUEST_LIST and code matches -> unlock + personalise
// 3) If MASTER_CODE matches -> unlock (even if name isn't in list)
//
// Events rules:
// - events: ["Wedding"] OR ["Betrothal"] OR ["Both"]
// - seats: max seats allowed for that guest
//
// Google Sheets RSVP (optional)
// -----------------------------
// If you create a Google Apps Script endpoint, paste it below.
// Example steps are inside README (in the response message).
//
window.INVITE_SETTINGS = {
  REQUIRE_CODE: true,
  // Master code lets you open the site even if the guest isn't in the list
  MASTER_CODE: "ALJO",
  // WhatsApp number to receive RSVP & wishes (digits only, no +)
  // Example: Australia: 614xxxxxxxx | India: 91xxxxxxxxxx
  WHATSAPP_NUMBER: "61420852655"
};

// Add your guests here. Codes can be anything (simple + easy to share).
window.GUEST_LIST = [
  { name: "Amal Mathew",   code: "AMAL26",  seats: 2, events: ["Wedding"],   note: "" },
  { name: "Nithin",       code: "NITH26",  seats: 1, events: ["Wedding"],   note: "" },
  { name: "Sreejith",     code: "SREE26",  seats: 2, events: ["Wedding"],   note: "" },
  { name: "Anu",          code: "ANU26",   seats: 2, events: ["Both"],     note: "" },

  // Examples:
  // { name: "Full Name", code: "FAMILY01", seats: 4, events: ["Both"], note: "Family" },
  // { name: "Friend Name", code: "FRIEND02", seats: 1, events: ["Wedding"], note: "" },
];
