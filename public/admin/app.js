/* IEMSS UTHM site manager — dashboard logic. */
(function () {
"use strict";

var C = null;              // the whole site content
var PHOTOS = {};           // which photo files exist, and when they changed
var dirty = false;
var current = "home";

var $ = function (id) { return document.getElementById(id); };
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

/* ---------- read / write a value by path, e.g. "org.high.0.name" ---------- */
function get(p){ return p.split(".").reduce(function(o,k){ return o == null ? o : o[k]; }, C); }
function set(p,v){ var k = p.split("."), last = k.pop(); k.reduce(function(o,x){ return o[x]; }, C)[last] = v; }

/* ---------- form helpers ---------- */
function field(path, label, opts){
  opts = opts || {};
  var v = opts.value !== undefined ? opts.value : get(path);
  var type = opts.type || "text";
  return '<label class="f"><span>' + esc(label) + "</span>" +
    '<input type="' + type + '" data-path="' + esc(path) + '" value="' + esc(v) + '"' +
    (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : "") + ">" +
    (opts.hint ? '<span class="hint" style="margin-top:5px;display:block">' + esc(opts.hint) + "</span>" : "") +
    "</label>";
}
function area(path, label, hint, rows){
  return '<label class="f"><span>' + esc(label) + "</span>" +
    '<textarea data-path="' + esc(path) + '"' + (rows ? ' style="min-height:' + rows + 'px"' : "") + ">" +
    esc(get(path)) + "</textarea>" +
    (hint ? '<span class="hint" style="margin-top:5px;display:block">' + esc(hint) + "</span>" : "") +
    "</label>";
}
function card(title, hint, body){
  return '<div class="card"><h2>' + esc(title) + "</h2>" +
    (hint ? '<p class="hint">' + esc(hint) + "</p>" : "") + body + "</div>";
}
function rowtop(n, title, listPath, i, len){
  return '<div class="rowtop"><span class="num">' + (n) + "</span><b>" + esc(title || "Untitled") + "</b>" +
    '<button class="sm" data-move="' + listPath + '" data-i="' + i + '" data-d="-1"' + (i === 0 ? " disabled" : "") + ' title="Move up">&uarr;</button>' +
    '<button class="sm" data-move="' + listPath + '" data-i="' + i + '" data-d="1"' + (i === len-1 ? " disabled" : "") + ' title="Move down">&darr;</button>' +
    '<button class="sm danger" data-del="' + listPath + '" data-i="' + i + '">Delete</button></div>';
}
function addBtn(listPath, label){
  return '<button data-add="' + listPath + '">+ ' + esc(label) + "</button>";
}
function photo(slot, file, label){
  var stamp = PHOTOS[file];              /* set once a photo exists */
  var has = !!stamp;
  var url = "/" + file + (stamp && stamp !== 1 ? "?v=" + stamp : "");
  return '<div class="ph' + (has ? " set" : "") + '" data-slot="' + esc(slot) + '" data-file="' + esc(file) + '"' +
    (has ? ' style="background-image:url(\'' + esc(url) + '\')"' : "") + ">" +
    '<button class="x" data-rm="' + esc(slot) + '" title="Remove">&times;</button>' +
    '<span class="lab">' + esc(has ? (label || "Replace") : (label || "Add photo")) + "</span></div>";
}
function slug(s){
  return String(s).replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40) || "event";
}

/* ---------- countdown datetime helpers ---------- */
function toLocalInput(iso){                 /* "2026-10-10T20:00:00+08:00" -> "2026-10-10T20:00" */
  var m = String(iso || "").match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? m[1] + "T" + m[2] : "";
}
function fromLocalInput(v){                 /* "2026-10-10T20:00" -> "2026-10-10T20:00:00+08:00" */
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? v + ":00+08:00" : v;
}

/* ================= panes ================= */
var TABS = [
  ["home",       "Home page"],
  ["events",     "Upcoming events"],
  ["past",       "Past events"],
  ["roster",     "Duty roster"],
  ["committee",  "Committee"],
  ["membership", "Membership page"],
  ["contact",    "Contact & office"],
  ["settings",   "Settings"]
];

var PANES = {

home: function(){
  return card("The big headline", "The first thing anyone sees when they open the website.",
      field("hero.title", "Headline") +
      area("hero.body", "Paragraph under the headline")) +

    card("Main photo and committee photo",
      "Click a box to pick a photo from your computer. It is shrunk and saved automatically — you do not need to resize anything first.",
      '<div class="grid2">' +
        "<div>" + photo("hero", "assets/hero.jpg", "Main background photo") +
          '<p class="hint" style="margin-top:8px">Goes behind the headline. A wide photo works best, with the people on the RIGHT side — the words sit on the left.</p></div>' +
        "<div>" + photo("committee", "assets/committee.jpg", "Committee photo") +
          '<p class="hint" style="margin-top:8px">Sits next to the "Who we are" writing.</p></div>' +
      "</div>") +

    card("Who we are", "The short description of IEMSS on the home page.",
      field("about.heading", "Section title") +
      area("about.p1", "First paragraph") +
      area("about.p2", "Second paragraph")) +

    card("Member count", "The big number on the home page.",
      '<div class="grid2">' +
        field("members.count", "How many members", { type: "number" }) +
        field("members.caption", "Words after the number", { ph: "and still counting" }) +
      "</div>" +
      area("members.blurb", "Small print under the number")) +

    card("Countdown on the home page", "The clock counting down to the next event.",
      field("next.name", "Event name") +
      '<div class="grid2">' +
        '<label class="f"><span>Date and time</span><input type="datetime-local" data-when="next.when" value="' +
          esc(toLocalInput(C.next.when)) + '"></label>' +
        field("next.label", "Words shown beside it", { ph: "Saturday, 10 October 2026" }) +
      "</div>" +
      area("next.blurb", "Short description")) +

    card("Session", "Shown in the sidebar and footer.", field("session", "Session"));
},

events: function(){
  var up = C.upcoming.map(function(e,i){
    return '<div class="row">' + rowtop(i+1, e.name, "upcoming", i, C.upcoming.length) +
      field("upcoming." + i + ".name", "Event name") +
      '<div class="grid3">' +
        field("upcoming." + i + ".date", "Date", { type: "date" }) +
        field("upcoming." + i + ".label", "Day or date range", { ph: "Saturday" }) +
        field("upcoming." + i + ".venue", "Place", { ph: "Dewan Kuliah A, G3" }) +
      "</div></div>";
  }).join("");

  var tba = C.upcomingTBA.map(function(e,i){
    return '<div class="row">' + rowtop(i+1, e.name, "upcomingTBA", i, C.upcomingTBA.length) +
      field("upcomingTBA." + i + ".name", "Event name") + "</div>";
  }).join("");

  return card("Events with a date", "These show on the Upcoming events page, and the next three appear on the home page.",
      up + addBtn("upcoming", "Add an event")) +
    card("Events with no date yet", 'These show under "dates to be announced".',
      tba + addBtn("upcomingTBA", "Add an event"));
},

past: function(){
  var rows = C.past.map(function(e,i){
    var p = e.photos || slug(e.name);
    return '<div class="row">' + rowtop(i+1, e.name, "past", i, C.past.length) +
      field("past." + i + ".name", "Event name") +
      '<div class="grid3">' +
        field("past." + i + ".date", "Date as written", { ph: "19 June 2026" }) +
        field("past." + i + ".venue", "Place") +
        field("past." + i + ".year", "Group under which year", { ph: "2026" }) +
      "</div>" +
      '<span class="hint" style="display:block;margin-bottom:8px">Three photos from the day</span>' +
      '<div class="strip3">' +
        photo("event:" + p + ":1", "assets/events/" + p + "-1.jpg", "Photo 1") +
        photo("event:" + p + ":2", "assets/events/" + p + "-2.jpg", "Photo 2") +
        photo("event:" + p + ":3", "assets/events/" + p + "-3.jpg", "Photo 3") +
      "</div></div>";
  }).join("");
  return card("Past events", "Newest first. Each one can hold three photos.",
    rows + addBtn("past", "Add a past event"));
},

roster: function(){
  var r = C.roster;
  var g = '<div class="scroll"><div class="rost"><div class="rh t">Time</div>' +
    r.days.map(function(d){ return '<div class="rh">' + esc(d) + "</div>"; }).join("");
  r.hours.forEach(function(h, ri){
    g += '<div class="rl">' + esc(h) + "</div>";
    r.days.forEach(function(d, ci){
      var v = r.grid[ri][ci];
      var on = v !== false && v !== null && v !== undefined;
      g += '<div class="sl' + (on ? " on" : "") + '" data-slot-r="' + ri + '" data-slot-c="' + ci + '">' +
        '<span class="tk">' + (on ? "&#10003;" : "") + "</span>" +
        '<input data-name-r="' + ri + '" data-name-c="' + ci + '" value="' + esc(on ? v : "") +
        '" placeholder="name"></div>';
    });
  });
  g += "</div></div>";

  return card("Who is in the office, and when",
      "Click a square to turn that hour on or off. When a square is on you can type the name of whoever is on duty — or leave it blank to just show the office as open.",
      g) +
    card("Notice above the roster", "Use this to say the roster is not final yet. Clear both boxes to hide the notice.",
      field("roster.statusTitle", "Notice heading") +
      area("roster.status", "Notice text")) +
    card("Introduction", "The paragraph at the top of the duty roster page.",
      area("roster.note", "Text"));
},

committee: function(){
  var o = C.org;
  var fa = o.facultyAdvisors.map(function(a,i){
    return '<div class="row">' + rowtop(i+1, a.name, "org.facultyAdvisors", i, o.facultyAdvisors.length) +
      field("org.facultyAdvisors." + i + ".name", "Name and title") + "</div>";
  }).join("");
  var sa = o.studentAdvisors.map(function(a,i){
    return '<div class="row">' + rowtop(i+1, a.name, "org.studentAdvisors", i, o.studentAdvisors.length) +
      field("org.studentAdvisors." + i + ".name", "Name") + "</div>";
  }).join("");
  var hi = o.high.map(function(h,i){
    return '<div class="row">' + rowtop(i+1, h.role, "org.high", i, o.high.length) +
      '<div class="grid2">' + field("org.high." + i + ".role", "Position") +
      field("org.high." + i + ".name", "Name") + "</div></div>";
  }).join("");
  var dp = o.departments.map(function(d,i){
    var mem = d.members.map(function(m,j){
      return '<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px">' +
        '<input data-path="org.departments.' + i + '.members.' + j + '.name" value="' + esc(m.name) + '">' +
        '<button class="sm danger" data-del="org.departments.' + i + '.members" data-i="' + j + '">&times;</button></div>';
    }).join("");
    return '<div class="row">' + rowtop(i+1, d.name, "org.departments", i, o.departments.length) +
      '<div class="grid2">' + field("org.departments." + i + ".name", "Department name") +
      field("org.departments." + i + ".hod", "Head of department") + "</div>" +
      '<span class="hint" style="display:block;margin-bottom:8px">Members</span>' + mem +
      addBtn("org.departments." + i + ".members", "Add a member") + "</div>";
  }).join("");

  return card("Faculty advisors", "Shown at the very top of the organisation chart.",
      fa + addBtn("org.facultyAdvisors", "Add an advisor")) +
    card("Student advisors", "", sa + addBtn("org.studentAdvisors", "Add an advisor")) +
    card("High committee", "Chairperson down to treasurer. The first four also appear on the home page.",
      hi + addBtn("org.high", "Add a position")) +
    card("Departments", "", dp + addBtn("org.departments", "Add a department"));
},

membership: function(){
  var m = C.membership;
  var b = m.benefits.map(function(x,i){
    return '<div class="row">' + rowtop(i+1, x.title, "membership.benefits", i, m.benefits.length) +
      field("membership.benefits." + i + ".title", "Title") +
      area("membership.benefits." + i + ".body", "Description") + "</div>";
  }).join("");
  var s = m.steps.map(function(x,i){
    return '<div class="row">' + rowtop(i+1, x.title, "membership.steps", i, m.steps.length) +
      field("membership.steps." + i + ".title", "Step") +
      area("membership.steps." + i + ".body", "Detail") + "</div>";
  }).join("");
  var f = m.faqs.map(function(x,i){
    return '<div class="row">' + rowtop(i+1, x.q, "membership.faqs", i, m.faqs.length) +
      field("membership.faqs." + i + ".q", "Question") +
      area("membership.faqs." + i + ".a", "Answer") + "</div>";
  }).join("");

  return card("Registration day countdown", "The clock at the top of the membership page.",
      field("regDay.name", "Event name") +
      '<div class="grid2">' +
        '<label class="f"><span>Date and time</span><input type="datetime-local" data-when="regDay.when" value="' +
          esc(toLocalInput(C.regDay.when)) + '"></label>' +
        field("regDay.label", "Words shown beside it") +
      "</div>" +
      area("regDay.blurb", "Short description")) +
    card("Opening paragraph", "", area("membership.lede", "Text")) +
    card("The fee notice", "The gold box about the RM50 being covered by first-semester fees.",
      field("membership.noteTitle", "Notice heading") +
      area("membership.noteBody", "Notice text") +
      area("membership.costBody", "Paragraph under the notice")) +
    card("What you get", "", b + addBtn("membership.benefits", "Add a benefit")) +
    card("How to register", "", s + addBtn("membership.steps", "Add a step")) +
    card("Common questions", "", f + addBtn("membership.faqs", "Add a question"));
},

contact: function(){
  return card("Contact details", "Shown on the contact page, the home page and the footer.",
      '<div class="grid2">' +
        field("contact.email", "Email address") +
        field("contact.office", "Office") +
      "</div>" +
      field("contact.address", "Full address") +
      area("contact.blurb", "Short line on the home page panel")) +
    card("Links", "",
      field("contact.iem", "IEM main website") +
      field("contact.socials", "Social media link (Linktree)") +
      field("contact.cardStatus", "Membership card status page") +
      field("contact.cardStatusLabel", "Wording on that button")) +
    card("Where contact form messages go",
      "Messages are saved to your Google Sheet and emailed to the secretariat. Do not change these unless the Apps Script has been set up again.",
      field("forms.endpoint", "Apps Script web app address") +
      field("forms.sheet", "Google Sheet link (a note for yourself — the website does not use it)") +
      area("forms.successMsg", "Message shown after sending") +
      area("forms.failMsg", "Message shown if sending fails"));
},

settings: function(){
  return card("Change the password", "",
      '<div class="grid2">' +
        '<label class="f"><span>Current password</span><input type="password" id="pwOld"></label>' +
        '<label class="f"><span>New password</span><input type="password" id="pwNew"></label>' +
      "</div><button id=\"pwBtn\">Change password</button>" +
      '<p class="hint" style="margin-top:12px">If the password is ever lost, delete the file <code>data/.auth.php</code> on the server and the manager will ask you to set a new one.</p>') +
    card("Earlier versions",
      "Every time you save, a copy of the previous version is kept. If something goes wrong, bring one back.",
      '<div id="backups"><p class="hint">Loading…</p></div>') +
    card("How this works",
      "",
      '<p class="hint" style="margin:0">Everything you type here is stored in one file on the server, <code>data/content.json</code>. ' +
      'When you press Save and publish, the website reads the new version immediately — there is nothing to upload and nothing to install. ' +
      'Photos go into the <code>assets</code> folder and are shrunk automatically so the site stays fast.</p>');
}
};

/* ================= rendering ================= */
function renderTabs(){
  $("tabs").innerHTML = TABS.map(function(t){
    return '<a data-tab="' + t[0] + '"' + (t[0] === current ? ' class="on"' : "") + ">" + esc(t[1]) + "</a>";
  }).join("");
}
function renderPane(){
  $("panes").innerHTML = '<div class="pane on">' + PANES[current]() + "</div>";
  if (current === "settings") loadBackups();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function rerender(){ renderTabs(); renderPane(); }

/* ================= state ================= */
function markDirty(){
  dirty = true;
  $("savebar").classList.add("dirty");
  $("dot").className = "dot warn";
  $("state").textContent = "Not saved yet";
}
function markClean(when){
  dirty = false;
  $("savebar").classList.remove("dirty");
  $("dot").className = "dot";
  $("state").textContent = when ? ("Saved and live — " + when) : "Everything is saved";
}
function say(text, good){
  var m = $("msg");
  m.textContent = text;
  m.className = "msg show " + (good ? "good" : "bad");
  if (good) setTimeout(function(){ m.className = "msg"; }, 4000);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ================= server ================= */
var TOKEN = "";
function api(action, payload){
  return fetch("/api/" + action, {
    method: "POST",
    headers: Object.assign({ "content-type": "application/json" },
                           TOKEN ? { authorization: "Bearer " + TOKEN } : {}),
    body: JSON.stringify(payload || {})
  }).then(function(r){ return r.json(); });
}
function apiForm(action, form){
  return fetch("/api/" + action, {
    method: "POST",
    headers: TOKEN ? { authorization: "Bearer " + TOKEN } : {},
    body: form
  }).then(function(r){ return r.json(); });
}
function post(fields, isForm){
  if (isForm){
    var act = fields.get("action"); fields.delete("action");
    return apiForm(act, fields);
  }
  var a = fields.action; delete fields.action; delete fields.token;
  return api(a, fields);
}

function load(){
  api("load").then(function(j){
    if (!j.ok) return say(j.error, false);
    C = j.content;
    PHOTOS = j.photos || {};
    markClean();
    rerender();
  }).catch(function(){ say("Could not reach the server.", false); });
}

function save(){
  if (!C) return;
  $("save").disabled = true;
  $("state").textContent = "Saving…";
  post({ action: "save", content: JSON.stringify(C) }).then(function(j){
    $("save").disabled = false;
    if (!j.ok) { say(j.error, false); markDirty(); return; }
    markClean(j.saved);
    say("Saved. The website is updated.", true);
  }).catch(function(){
    $("save").disabled = false;
    say("Could not reach the server. Nothing was saved — keep this page open and try again.", false);
    markDirty();
  });
}

function loadBackups(){
  api("backups").then(function(j){
    var box = $("backups");
    if (!box) return;
    if (!j.ok || !j.backups.length) { box.innerHTML = '<p class="hint">No earlier versions yet.</p>'; return; }
    box.innerHTML = j.backups.map(function(b){
      return '<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-top:1px solid rgba(64,166,255,.1)">' +
        '<span style="flex:1;font-size:14px">' + esc(b.when) + "</span>" +
        '<button class="sm" data-restore="' + esc(b.file) + '">Bring this one back</button></div>';
    }).join("");
  });
}

/* ================= events ================= */
document.addEventListener("input", function(e){
  var el = e.target;
  if (el.dataset.path){ set(el.dataset.path, el.value); markDirty(); }
  if (el.dataset.when){ set(el.dataset.when, fromLocalInput(el.value)); markDirty(); }
  if (el.dataset.nameR !== undefined){
    C.roster.grid[+el.dataset.nameR][+el.dataset.nameC] = el.value;
    markDirty();
  }
});

document.addEventListener("click", function(e){
  var t = e.target;

  var tab = t.closest("[data-tab]");
  if (tab){ current = tab.dataset.tab; rerender(); return; }

  var add = t.closest("[data-add]");
  if (add){
    var path = add.dataset.add, list = get(path);
    var blank = {
      "upcoming":    { name: "New event", date: "", label: "", venue: "" },
      "upcomingTBA": { name: "New event" },
      "past":        { year: String(new Date().getFullYear()), name: "New event", date: "", venue: "", photos: "" },
      "membership.benefits": { title: "New benefit", body: "" },
      "membership.steps":    { title: "New step", body: "" },
      "membership.faqs":     { q: "New question?", a: "" },
      "org.facultyAdvisors": { name: "" },
      "org.studentAdvisors": { name: "" },
      "org.high":            { role: "New position", name: "" },
      "org.departments":     { name: "New department", hod: "", members: [] }
    }[path] || { name: "" };
    list.push(JSON.parse(JSON.stringify(blank)));
    markDirty(); renderPane(); return;
  }

  var del = t.closest("[data-del]");
  if (del){
    if (!confirm("Delete this for good?")) return;
    get(del.dataset.del).splice(+del.dataset.i, 1);
    markDirty(); renderPane(); return;
  }

  var mv = t.closest("[data-move]");
  if (mv){
    var arr = get(mv.dataset.move), i = +mv.dataset.i, j = i + (+mv.dataset.d);
    if (j < 0 || j >= arr.length) return;
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    markDirty(); renderPane(); return;
  }

  var sl = t.closest("[data-slot-r]");
  if (sl && !t.matches("input")){
    var r = +sl.dataset.slotR, c = +sl.dataset.slotC;
    var v = C.roster.grid[r][c];
    C.roster.grid[r][c] = (v === false || v === null || v === undefined) ? "" : false;
    markDirty(); renderPane(); return;
  }

  var rm = t.closest("[data-rm]");
  if (rm){
    e.stopPropagation();
    if (!confirm("Remove this photo?")) return;
    post({ action: "delete_photo", slot: rm.dataset.rm }).then(function(j){
      if (!j.ok) return say(j.error, false);
      delete PHOTOS[rm.closest(".ph").dataset.file];
      renderPane();
    });
    return;
  }

  var ph = t.closest(".ph");
  if (ph){ pickPhoto(ph); return; }

  var rs = t.closest("[data-restore]");
  if (rs){
    if (!confirm("Replace the website's current content with this older version?")) return;
    post({ action: "restore", file: rs.dataset.restore }).then(function(j){
      if (!j.ok) return say(j.error, false);
      say("Brought back. The website is updated.", true);
      load();
    });
    return;
  }

  if (t.id === "save") save();

  if (t.id === "signout"){
    if (dirty && !confirm("You have changes that are not saved. Sign out anyway?")) return;
    try { sessionStorage.removeItem("iemss-token"); } catch (e) {}
    location.reload();
  }

  if (t.id === "pwBtn"){
    var o = $("pwOld").value, n = $("pwNew").value;
    api("password", { old: o, "new": n }).then(function(j){
      if (!j.ok) return say(j.error, false);
      $("pwOld").value = ""; $("pwNew").value = "";
      say("Password changed.", true);
    });
  }
});

/* ---------- photo picking ---------- */
function pickPhoto(box){
  var slot = box.dataset.slot;

  /* a past event needs a photo prefix before its photos can be saved */
  if (slot.indexOf("event:") === 0 && slot.indexOf(":undefined:") < 0){
    var row = box.closest(".row");
    if (row){
      var nameInput = row.querySelector('[data-path$=".name"]');
      var idx = nameInput ? nameInput.dataset.path.split(".")[1] : null;
      if (idx !== null && !C.past[idx].photos){
        C.past[idx].photos = slug(C.past[idx].name);
        markDirty();
      }
    }
  }

  var input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = function(){
    var f = input.files[0];
    if (!f) return;
    box.querySelector(".lab").textContent = "Shrinking…";
    shrink(f).then(function(blob){
      box.querySelector(".lab").textContent = "Uploading…";
      var fd = new FormData();
      fd.append("slot", slot);
      fd.append("file", blob, "photo.jpg");
      return apiForm("upload", fd);
    }).then(function(j){
      if (!j.ok){ say(j.error, false); renderPane(); return; }
      PHOTOS[j.path] = j.stamp;
      renderPane();
      say("Photo saved.", true);
    }).catch(function(err){
      say("That photo could not be used. Try a different one.", false);
      renderPane();
    });
  };
  input.click();
}

/* Shrink a photo in the browser: 1800px on the long edge, JPEG quality 82.
   Doing it here keeps the upload small and means the server needs no image
   software at all. */
function shrink(file){
  var MAX = 1800, Q = 0.82;
  return createImageBitmap(file, { imageOrientation: "from-image" })
    .catch(function(){ return createImageBitmap(file); })
    .then(function(bmp){
      var s = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
      var c = document.createElement("canvas");
      c.width  = Math.max(1, Math.round(bmp.width  * s));
      c.height = Math.max(1, Math.round(bmp.height * s));
      var ctx = c.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(bmp, 0, 0, c.width, c.height);
      bmp.close && bmp.close();
      return new Promise(function(res, rej){
        c.toBlob(function(b){ b ? res(b) : rej(new Error("encode failed")); }, "image/jpeg", Q);
      });
    });
}

/* ---------- don't lose work ---------- */
window.addEventListener("beforeunload", function(e){
  if (dirty){ e.preventDefault(); e.returnValue = ""; }
});
document.addEventListener("keydown", function(e){
  if ((e.ctrlKey || e.metaKey) && e.key === "s"){ e.preventDefault(); save(); }
});

/* ================= signing in ================= */
var $g = function (id) { return document.getElementById(id); };
var needSetup = false;

function gateMsg(t){
  var m = $g("gmsg");
  m.textContent = t;
  m.className = "msg bad show";
}

function showGate(setup){
  needSetup = setup;
  $g("gate").style.display = "grid";
  $g("shell").style.display = "none";
  if (setup){
    $g("gtitle").textContent = "Set up the site manager";
    $g("gsub").textContent = "Nobody has set a password yet. Choose one now — this is what you will use to sign in and edit the website.";
    $g("glab1").textContent = "New password (8 characters or more)";
    $g("pw1").setAttribute("autocomplete", "new-password");
    $g("pw2wrap").style.display = "block";
    $g("ghint").style.display = "block";
    $g("gbtn").textContent = "Create password and open the manager";
  }
  $g("pw1").focus();
}

function enterManager(token){
  TOKEN = token;
  try { sessionStorage.setItem("iemss-token", token); } catch (e) {}
  $g("gate").style.display = "none";
  $g("shell").style.display = "block";
  load();
}

function submitGate(){
  var pw = $g("pw1").value;
  if (needSetup){
    if (pw.length < 8) return gateMsg("Use at least 8 characters.");
    if (pw !== $g("pw2").value) return gateMsg("The two passwords do not match.");
  }
  $g("gbtn").disabled = true;
  api(needSetup ? "setup" : "login", { password: pw }).then(function(j){
    $g("gbtn").disabled = false;
    if (j.ok) enterManager(j.token);
    else gateMsg(j.error);
  }).catch(function(){
    $g("gbtn").disabled = false;
    gateMsg("Could not reach the server.");
  });
}

document.addEventListener("click", function(e){ if (e.target.id === "gbtn") submitGate(); });
document.addEventListener("keydown", function(e){
  if (e.key === "Enter" && $g("gate").style.display !== "none") submitGate();
});

/* a token from earlier in this browser tab saves signing in again on reload */
(function boot(){
  var saved = "";
  try { saved = sessionStorage.getItem("iemss-token") || ""; } catch (e) {}
  if (saved){
    TOKEN = saved;
    api("load").then(function(j){
      if (j.ok){ enterManager(saved); }
      else { TOKEN = ""; try { sessionStorage.removeItem("iemss-token"); } catch (e) {} boot(); }
    }).catch(function(){ showGate(false); });
    return;
  }
  api("status").then(function(j){
    showGate(!(j && j.configured));
  }).catch(function(){
    showGate(false);
    gateMsg("Could not reach the server. If this site was just deployed, wait a moment and reload.");
  });
})();
})();
