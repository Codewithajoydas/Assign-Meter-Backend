const docs = {
  guide: {
    title: "User Guide",
    group: "Getting started",
    markdown: `# Assign Meter — User Guide

**App name:** Assign Meter  
**Publisher / Developer:** Ajoy Das (CODEWITHAJOYDAS)  
**Platform:** Android (Google Play Store), companion Web Dashboard  
**Version covered:** Mobile v1.1.0 · Web app · Backend v1.0.0  
**Last updated:** August 2026

---

## 1. What is Assign Meter?

Assign Meter is a field-operations app used by installation crews, supervisors, and administrators to track the assignment and installation status of electrical metering equipment — **Meters, CTs (Current Transformers), NICs, PTs (Potential Transformers), SIM cards, and Seals** — for a power distribution project. It replaces paper-based tracking with a mobile app (for field engineers) and a web dashboard (for supervisors/admins).

The system has three parts:

| Component | Who uses it | Purpose |
|---|---|---|
| **Assign Meter (Mobile)** | Field engineers / installers | Scan and assign equipment on-site, geo-tag installations |
| **Assign Meter (Web)** | Supervisors / admins | Review, filter, map, and download assignment data |
| **Backend API** | Both apps | Stores and syncs all data in real time |

---

## 2. Getting Started

### 2.1 Installation

1. Download **Assign Meter** from the Google Play Store.
2. Install and open the app.
3. Grant permissions when prompted (see [Section 6 — Permissions](#9-permissions-the-app-uses)).

### 2.2 Logging In

- Accounts are created by an **Administrator** — there is no public self-signup inside the app.
- On the login screen, enter the **email and password** provided by your admin.
- On successful login, your session token is stored securely on your device (using encrypted secure storage) so you stay signed in.
- If you forget your password, contact your project administrator to have it reset.

### 2.3 User Roles

- **Field Engineer / Installer** — assigns and submits equipment records, tags installation locations.
- **Supervisor** — everything a field engineer can do, plus is linked to submitted records for accountability.
- **Admin** — full access, including creating new user accounts (via the web dashboard).

Each user is also tagged to a **package/zone** (e.g., ASS1–ASS10) which scopes the equipment they work with.

---

## 3. Home Screen

After logging in, the Home screen greets you (Good Morning/Afternoon/Evening) and shows quick-access tiles for each equipment category:

- **METER**
- **CT**
- **NIC**
- **PT**
- **SIM**
- **SEAL**
- **Assign Location**

Tap any tile to open that category's assignment flow.

---

## 4. Assigning Equipment (Meter / CT / NIC / PT / SIM / Seal)

Each category follows a similar flow:

1. **Open the category** (e.g., "METER") from the Home screen.
2. **Identify the equipment** — either:
   - Scan the equipment's barcode/QR code using your camera, or
   - Pick a photo of the code from your gallery (the app will scan it), or
   - Type the equipment/serial number manually.
3. **Fill in required details**, which vary by category:
   - Meter: meter type, installation type, store location (Golaghat/Nagaon), agency, installer ID.
   - SIM: network provider (Airtel/Jio), agency, installer ID.
   - Seal: seal type (Box, GTW, Left, NIC, Right, Terminal), agency, installer ID.
   - CT, NIC, PT follow the same equipment-and-agency pattern.
4. **Submit.** The record is created with status **"pending"** until reviewed/approved by a supervisor. Records can later move to **active**, **installed**, or **rejected**.
5. You'll see a confirmation, and the item becomes visible to supervisors on the web dashboard in real time.

> **Tip:** Each equipment number must be unique in the system (for SIM and Seal categories). If you get a "already exists" error, double-check the number you scanned or entered.

---

## 5. Assign Location

Use this screen to **geo-tag** where a meter was physically installed:

1. Open **Assign Location** from the Home screen.
2. The app automatically requests your current GPS location (you must allow the **Location** permission).
3. Confirm or adjust the pin on the map.
4. Enter the **Meter Number** and **Consumer Number**.
5. Submit — this links the meter to a precise latitude/longitude for the utility's records.

---

## 6. Meter Status & Unmapped Reports

- **Meter Status** tab — check the current status (pending / active / installed / rejected) of meters you or your team have submitted.
- **Unmapped Reports** tab — view/download a report of meters that have not yet been location-mapped, so field teams know what's outstanding. Large reports are generated on the backend (using a fast CSV/DuckDB pipeline) and can take a moment to prepare.

You'll also receive **push notifications** on key updates (e.g., report ready, status changes), so it's worth allowing notification permissions.

---

## 7. Settings

From the Settings tab you can:

- View your profile (name, role).
- **Log out** of the app (this clears your locally stored session).
- General Settings, App Information, and Security are shown as "Coming Soon" in the current version.

---

## 8. The Web Dashboard (for Supervisors/Admins)

The companion **Assign Meter Web** app is a browser-based dashboard where supervisors and admins can:

- View all submitted equipment records in a **sortable, filterable table**.
- View installation points on an **interactive map**.
- **Download** individual records or **bulk-download** all data as spreadsheets (a pre-formatted "Meter Assign Template" is also available).
- Refresh data live as field engineers submit new records (the dashboard updates via real-time server events, no manual refresh needed).
- Manage installer/agency assignments.

Access is via the same account system — log in with the email and password issued by your admin.

---

## 9. Permissions the App Uses

| Permission | Why it's needed | What happens if you deny it |
|---|---|---|
| **Camera** | To scan barcodes/QR codes on equipment for fast, accurate identification | You can still type equipment numbers manually |
| **Photo Library** | To scan a barcode from an existing photo instead of the live camera | Live camera scanning still works |
| **Location (GPS)** | To record the precise install location of a meter | You cannot use Assign Location, and location-dependent features won't work |
| **Notifications** | To alert you about report readiness and status updates | You simply won't receive push alerts |

---

## 10. Troubleshooting

- **Can't log in:** Confirm your email/password with your admin — accounts are provisioned by admins only. Check your internet connection.
- **Camera scan not working:** Make sure Camera permission is granted in your phone's Settings → Apps → Assign Meter → Permissions.
- **Location not detected:** Ensure device GPS/Location Services are on, and permission is granted. Try moving to an area with a clearer sky view.
- **"Equipment already exists" error:** The equipment/serial number was likely already registered — verify the number and check with your supervisor.
- **App logs you out unexpectedly:** Your session token may have expired — simply log back in.

---

## 11. Support

For account issues, password resets, or bugs, contact your project administrator or:

**Developer:** Ajoy Das — CODEWITHAJOYDAS  
**Support contact:** *codewithajoydas@gmail.com*  
**GitHub:** github.com/Codewithajoydas

---

*This guide covers the app as of the version noted above. Screens and workflows may be updated in future releases.*`
  },
  privacy: {
    title: "Privacy Policy",
    group: "Legal",
    markdown: `# Privacy Policy — Assign Meter

**Effective date:** *21-08-2026*  
**App:** Assign Meter (Android package: \`com.ajoy974.assignMeter\`), Play Store listing "Assign Meter"  
**Developer:** Ajoy Das, operating as CODEWITHAJOYDAS ("we", "us", "our")  
**Contact:** *codewithajoydas@gmail.com*

This Privacy Policy explains how Assign Meter ("the App") — including its mobile app and associated web dashboard — collects, uses, stores, and protects information when used by field engineers, supervisors, and administrators of a client organization for equipment installation tracking.

Assign Meter is a **business/workforce tool**. Accounts are created and assigned by an administrator on behalf of an employer or client organization; it is not intended for use by the general public, and it is not intended for children.

---

## 1. Information We Collect

### 1.1 Account Information

When your administrator creates your account, we collect:

- Full name
- Email address
- Password (stored only as a securely hashed value — we never store or can view your plain-text password)
- Role/permission level (e.g., field engineer, supervisor, admin)
- Assigned work package/zone

### 1.2 Location Data

When you use the **Assign Location** feature (or any feature that geo-tags an installation), the App requests access to your device's **precise GPS location**. This is used solely to record the latitude/longitude of an installed meter for operational and record-keeping purposes. Location is only accessed when you actively use a location-tagging feature — the App does not track your location in the background.

### 1.3 Camera and Photos

The App requests **Camera** access to scan barcodes/QR codes printed on equipment (meters, seals, SIM cards, etc.), and may request **Photo Library** access to scan a barcode from an existing image. These permissions are used only to read equipment identifiers; the App does not use the camera to take or store personal photographs of you.

### 1.4 Operational / Work Data

As part of normal use, the App collects work-related records you submit, including:

- Equipment identifiers (meter numbers, CT/NIC/PT/SIM/Seal numbers)
- Equipment type, installation type, agency, installer ID, store location
- Assignment/installation status and remarks
- Timestamps of submissions and updates

### 1.5 Device and Push Notification Data

- A device push-notification token (via Expo's push notification service) is stored against your account so the App can send you operational alerts (e.g., report readiness, status changes). You can disable notifications at any time from your device settings.
- Standard technical data needed to operate the App (e.g., session/authentication tokens) is stored securely on your device.

### 1.6 Information We Do NOT Collect

We do not collect advertising identifiers, browsing history outside the App, contacts, SMS/call logs, or biometric data. We do not use the App to serve third-party advertising.

---

## 2. How We Use Information

We use the information described above to:

- Authenticate you and maintain your session
- Let you create, view, and manage equipment assignment records
- Record and map installation locations for the client organization
- Generate operational reports (e.g., unmapped-equipment reports) for supervisors/admins
- Send you operational push notifications
- Maintain the security and integrity of the system
- Provide support and troubleshoot issues

We do **not** sell your personal information, and we do not use it for third-party advertising or marketing.

---

## 3. How Information Is Stored and Secured

- Data is stored in a managed **MongoDB** database.
- Files/reports may be stored in a private **AWS S3** bucket.
- Passwords are hashed using industry-standard hashing (bcrypt) — never stored in plain text.
- Authentication uses signed **JWT tokens**; on the web dashboard, session tokens are additionally kept in secure, HTTP-only cookies to reduce exposure to client-side scripts.
- On mobile, session tokens are stored in the device's encrypted secure storage (Expo SecureStore), not in plain local storage.
- Communication between the App and our servers uses HTTPS/TLS encryption.

While we take reasonable measures to protect your information, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.

---

## 4. Who We Share Information With

We share information only as necessary to operate the service:

- **Your client organization / employer** — the utility or agency that commissioned the metering project has access to the operational data (equipment records, statuses, locations) submitted through the App, since this is the App's core business purpose.
- **Service providers (data processors)** who help us run the App, including:
  - Cloud database hosting (MongoDB)
  - Cloud file storage (Amazon Web Services / S3)
  - Backend hosting (Render)
  - Transactional email delivery (Resend / SMTP-based email)
  - Push notification delivery (Expo)

These providers process data only on our behalf and are not permitted to use it for their own purposes.

- **Legal requirements** — we may disclose information if required by law, regulation, or a valid legal process.

We do **not** sell, rent, or trade your personal information to third parties for marketing purposes.

---

## 5. Data Retention

We retain account and operational data for as long as your account is active or as needed to fulfill the operational/contractual purpose with the client organization, plus any additional period required for record-keeping, auditing, or legal compliance. When an account is deactivated, associated personal login credentials may be retained in an anonymized or restricted form, while operational equipment records may be retained by the client organization for asset-management purposes.

---

## 6. Your Choices and Rights

- **Location:** You can deny or revoke Location permission at any time via your device settings; this will disable location-tagging features but not the rest of the App.
- **Camera/Photos:** You can deny or revoke these permissions; you can still enter equipment numbers manually.
- **Notifications:** You can disable push notifications via your device settings.
- **Access/Correction/Deletion:** You may request access to, correction of, or deletion of your personal information by contacting us or your administrator at the details below, subject to any operational or legal retention requirements.
- **Account removal:** Since accounts are provisioned by administrators, account deactivation requests should generally go through your organization's administrator, who can also contact us directly.

---

## 7. Children's Privacy

Assign Meter is a workforce tool intended for use by adult employees, contractors, and administrators of client organizations. It is not directed at, and we do not knowingly collect information from, children.

---

## 8. International Data Handling

Our infrastructure providers (e.g., cloud database and storage hosting) may process or store data in data centers located outside your country. By using the App, you acknowledge that information may be processed in locations with data protection laws that may differ from your own jurisdiction. We take steps to ensure such processing remains consistent with this Policy.

---

## 9. Changes to This Policy

We may update this Privacy Policy from time to time to reflect changes in the App or legal requirements. We will update the "Effective date" above when changes are made. Continued use of the App after changes take effect constitutes acceptance of the updated Policy.

---

## 10. Contact Us

If you have questions about this Privacy Policy or how your information is handled, contact:

**Ajoy Das (CODEWITHAJOYDAS)**  
Email: *codewithajoydas@gmail.com*  
GitHub: github.com/Codewithajoydas

---

*This document is a general-purpose privacy policy template based on the App's actual functionality and data flows. Before publishing it (including in your Play Store listing), please have it reviewed against your specific contractual obligations with the client organization and applicable data protection law (e.g., India's Digital Personal Data Protection Act) — placeholders like 21-08-2026 and *codewithajoydas@gmail.com* must be filled in before this is used as your live policy.*`
  },
  terms: {
    title: "Terms & Conditions",
    group: "Legal",
    markdown: `# Terms and Conditions — Assign Meter

**Effective date:** *21-08-2026*  
**App:** Assign Meter (Android package: \`com.ajoy974.assignMeter\`) and the associated Assign Meter Web dashboard  
**Developer/Operator:** Ajoy Das, operating as CODEWITHAJOYDAS ("we", "us", "our")  
**Contact:** *codewithajoydas@gmail.com*

Please read these Terms and Conditions ("Terms") carefully before using Assign Meter (the "App"). By downloading, accessing, or using the App, you agree to be bound by these Terms. If you do not agree, do not use the App.

---

## 1. About the App

Assign Meter is a workforce management tool used to track the assignment, installation, and geo-location of electrical metering equipment (meters, CTs, NICs, PTs, SIM cards, and seals) on behalf of a client organization. It consists of a mobile application, a web dashboard, and supporting backend services.

---

## 2. Eligibility and Accounts

- The App is intended for use by **authorized personnel** — field engineers, supervisors, and administrators — acting on behalf of an employer, agency, or client organization engaged in an authorized metering project.
- Accounts are created by an **Administrator**; there is no open public registration within the App.
- You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.
- You must notify us or your administrator immediately of any unauthorized use of your account.
- You must provide accurate information when creating or updating your account.

---

## 3. License to Use

Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the App solely for its intended business purpose — recording and managing equipment installation data for your authorized project or organization.

You may not:

- Copy, modify, or create derivative works of the App;
- Reverse-engineer, decompile, or disassemble the App, except where permitted by law;
- Sell, rent, lease, sublicense, or otherwise transfer access to the App to any third party;
- Use the App for any purpose outside the authorized metering/installation-tracking workflow it was built for.

---

## 4. Acceptable Use

When using the App, you agree not to:

- Submit false, fraudulent, or intentionally inaccurate equipment or location data;
- Attempt to gain unauthorized access to accounts, data, or systems that are not yours;
- Interfere with or disrupt the App's servers, networks, or security features;
- Use automated means (bots, scrapers) to access or extract data from the App without authorization;
- Use the App in any way that violates applicable law or the rights of any third party.

We reserve the right to suspend or terminate accounts that violate this section.

---

## 5. Data You Submit

You are responsible for the accuracy of the equipment records, location data, and other operational information you submit through the App. Operational data submitted through the App (equipment assignments, statuses, locations, reports) may be considered the property of, or accessible to, the client organization for whom the metering project is being carried out, in accordance with your employment or contractor agreement with that organization.

For details on how personal information is collected and used, see our [Privacy Policy](#privacy-policy).

---

## 6. Permissions and Device Access

The App may request Camera, Photo Library, Location, and Notification permissions to function as described in the User Guide and Privacy Policy. You may decline or revoke these permissions via your device settings, though doing so may limit certain features (e.g., barcode scanning, location tagging, push alerts).

---

## 7. Intellectual Property

The App, including its design, source code, branding, and underlying technology, is owned by Ajoy Das / CODEWITHAJOYDAS (or licensed to us) and is protected by applicable intellectual property laws. Nothing in these Terms transfers any ownership rights to you, except the limited license described in Section 3.

---

## 8. Third-Party Services

The App relies on third-party infrastructure providers (e.g., cloud hosting, database, file storage, email, and push-notification services) to operate. We are not responsible for outages, errors, or data handling practices of these providers beyond our reasonable control, though we select providers that meet reasonable security standards.

---

## 9. Availability and Changes

We aim to keep the App available and functioning, but we do not guarantee uninterrupted or error-free operation. We may update, modify, suspend, or discontinue any part of the App (including specific features) at any time, with or without notice.

---

## 10. Disclaimer of Warranties

The App is provided **"as is" and "as available"**, without warranties of any kind, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement. We do not warrant that the App will be error-free, secure, or uninterrupted.

---

## 11. Limitation of Liability

To the maximum extent permitted by applicable law, Ajoy Das / CODEWITHAJOYDAS shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, revenue, or business opportunity, arising out of or in connection with your use of (or inability to use) the App, even if advised of the possibility of such damages. Our total liability for any claim arising from these Terms or the App shall not exceed the amount (if any) paid by you or on your behalf for use of the App in the twelve (12) months preceding the claim.

---

## 12. Indemnification

You agree to indemnify and hold harmless Ajoy Das / CODEWITHAJOYDAS from any claims, damages, liabilities, and expenses (including reasonable legal fees) arising from your misuse of the App, your violation of these Terms, or your violation of any third-party rights.

---

## 13. Termination

We may suspend or terminate your access to the App at any time, with or without cause or notice, including for violation of these Terms. Your administrator/organization may also revoke your access as part of their own personnel or project management processes. Upon termination, your right to use the App ceases immediately.

---

## 14. Governing Law and Jurisdiction

These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these Terms or the App shall be subject to the exclusive jurisdiction of the courts located in Assam, India, unless otherwise required by applicable law.

---

## 15. Changes to These Terms

We may update these Terms from time to time. Material changes will be reflected by updating the "Effective date" above. Continued use of the App after changes take effect constitutes your acceptance of the revised Terms.

---

## 16. Contact Us

For questions about these Terms, contact:

**Ajoy Das (CODEWITHAJOYDAS)**  
Email: *codewithajoydas@gmail.com*  
GitHub: github.com/Codewithajoydas

---

*This document is a general-purpose Terms & Conditions template based on the App's actual functionality. Before publishing (including for your Play Store listing), have it reviewed by a qualified legal professional to ensure it fits your specific business, contractual, and jurisdictional requirements — placeholders like 21-08-2026 and codewithajoydas@gmail.com must be filled in.*`
  }
};

const nav = document.getElementById("nav");
const content = document.getElementById("content");
const tocLinks = document.getElementById("tocLinks");
const breadcrumbs = document.getElementById("breadcrumbs");

function slugify(s){return s.toLowerCase().replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-")}
function renderNav(){
  nav.innerHTML = `
    <div class="nav-section">Documentation</div>
    <button data-doc="guide">User Guide</button>
    <div class="nav-section">Legal</div>
    <button data-doc="privacy">Privacy Policy</button>
    <button data-doc="terms">Terms & Conditions</button>`;
  nav.querySelectorAll("button").forEach(b=>b.onclick=()=>showDoc(b.dataset.doc));
}
function renderToc(){
  tocLinks.innerHTML="";
  content.querySelectorAll("h2,h3").forEach(h=>{
    const id=slugify(h.textContent); h.id=id;
    const a=document.createElement("a"); a.href="#"+id; a.textContent=h.textContent;
    if(h.tagName==="H3") a.className="sub";
    tocLinks.appendChild(a);
  });
}
function showDoc(key){
  const doc=docs[key]||docs.guide;
  document.title=`${doc.title} — Assign Meter`;
  content.innerHTML=marked.parse(doc.markdown);
  breadcrumbs.textContent=`Documentation  /  ${doc.title}`;
  document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.doc===key));
  document.getElementById("hero").style.display=key==="guide"?"block":"none";
  document.getElementById("quickGrid").style.display=key==="guide"?"grid":"none";
  renderToc();
  window.scrollTo({top:0,behavior:"smooth"});
  closeSidebar();
}
document.querySelectorAll("[data-doc]").forEach(el=>el.addEventListener("click",()=>showDoc(el.dataset.doc)));
renderNav(); showDoc("guide");

const sidebar=document.getElementById("sidebar"), backdrop=document.getElementById("backdrop");
document.getElementById("menuBtn").onclick=()=>{sidebar.classList.add("open");backdrop.classList.add("open")};
backdrop.onclick=closeSidebar;
function closeSidebar(){sidebar.classList.remove("open");backdrop.classList.remove("open")}

const modal=document.getElementById("searchModal"), globalSearch=document.getElementById("globalSearch"), searchInput=document.getElementById("searchInput"), results=document.getElementById("searchResults");
function openSearch(){modal.classList.add("open");modal.setAttribute("aria-hidden","false");setTimeout(()=>globalSearch.focus(),50)}
function closeSearch(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}
searchInput.onclick=openSearch;
document.getElementById("closeSearch").onclick=closeSearch;
modal.addEventListener("click",e=>{if(e.target===modal)closeSearch()});
function searchDocs(q){
  q=q.trim().toLowerCase();
  if(!q){results.innerHTML='<div style="padding:22px;color:var(--muted);font-size:12px">Type to search the documentation.</div>';return}
  const out=[];
  for(const [key,doc] of Object.entries(docs)){
    const lines=doc.markdown.split("\n");
    lines.forEach((line,i)=>{
      if(line.toLowerCase().includes(q)){
        const clean=line.replace(/[#*_`]/g,"").trim();
        if(clean) out.push({key,title:doc.title,text:clean,line:i+1});
      }
    });
  }
  results.innerHTML=out.slice(0,18).map((r,i)=>`<button class="result" data-result="${r.key}"><small>${r.title} · line ${r.line}</small><span>${escapeHtml(r.text)}</span></button>`).join("") || '<div style="padding:22px;color:var(--muted);font-size:12px">No matching documentation found.</div>';
  results.querySelectorAll("[data-result]").forEach(b=>b.onclick=()=>{showDoc(b.dataset.result);closeSearch()});
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
globalSearch.addEventListener("input",e=>searchDocs(e.target.value));
document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch()}
  if(e.key==="Escape")closeSearch();
});

const themeBtn=document.getElementById("themeBtn");
const saved=localStorage.getItem("assign-meter-theme");
if(saved==="dark")document.documentElement.classList.add("dark");
themeBtn.onclick=()=>{
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("assign-meter-theme",document.documentElement.classList.contains("dark")?"dark":"light");
};
