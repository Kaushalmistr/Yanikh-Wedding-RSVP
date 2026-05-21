# Document Management System - Quick Start Guide

## 🚀 Features at a Glance

### 1️⃣ RSVP Form - Document Upload (Step 4)
```
┌─────────────────────────────────────────────┐
│  📋 Final Confirmation                       │
├─────────────────────────────────────────────┤
│                                              │
│  📎 Upload Documents (Optional)              │
│  ┌──────────────────────────────────────┐   │
│  │  📤 Click to upload documents        │   │
│  │  JPG, PNG, WEBP, PDF (Max 10MB)      │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Uploaded Files:                             │
│  ┌──────────────────────────────────────┐   │
│  │ 📄 passport_copy.pdf      2.3 MB  ❌ │   │
│  │ 📄 visa_document.pdf      1.8 MB  ❌ │   │
│  │ 🖼️ flight_ticket.jpg      0.9 MB  ❌ │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ☑️ I confirm all information is accurate   │
│  ☑️ I consent to data usage                 │
│                                              │
│              [Submit My RSVP 💖]             │
└─────────────────────────────────────────────┘
```

### 2️⃣ Guest List - Documents Column
```
┌────────────────────────────────────────────────────────────┐
│  Name      Email         Status    WhatsApp   Documents    │
├────────────────────────────────────────────────────────────┤
│  John Doe  john@e.com    ✓ Yes     ✓ Sent     🔗 Link (3) │  ← Click to open modal
│  Jane Smith jane@e.com   Maybe     Pending    —            │  ← Click to upload
│  Bob Wilson bob@e.com    ✓ Yes     ✓ Sent     🔗 Link (5) │  ← Click to view/manage
└────────────────────────────────────────────────────────────┘
```

### 3️⃣ Documents Modal - Grid View
```
┌───────────────────────────────────────────────────────────────┐
│  Documents - John Doe • 3 documents                      ❌   │
├───────────────────────────────────────────────────────────────┤
│  📤 Upload  💾 Download Selected (2)  🗑️ Delete  [Grid|List] │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │    🖼️     │  │    📄     │  │    🖼️     │                   │
│  │  Image1  │  │  PDF Doc │  │  Ticket  │                   │
│  │  1.2 MB  │  │  2.3 MB  │  │  0.8 MB  │                   │
│  │    ☑️     │  │    ☑️     │  │    ☐     │  ← Selection     │
│  └──────────┘  └──────────┘  └──────────┘                   │
│                                                               │
│  Actions:                                                     │
│  • Click thumbnail to preview                                 │
│  • Select checkbox to mark for download/delete               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 4️⃣ Documents Modal - List View
```
┌───────────────────────────────────────────────────────────────┐
│  Documents - John Doe • 3 documents                      ❌   │
├───────────────────────────────────────────────────────────────┤
│  📤 Upload  💾 Download All as Zip  ☑️ Select All [Grid|List]│
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ☑️ 🖼️ passport_photo.jpg      1.2 MB   May 21, 2026   👁️ 💾 │
│  ☑️ 📄 visa_document.pdf        2.3 MB   May 20, 2026   👁️ 💾 │
│  ☐ 🖼️ flight_ticket.jpg        0.8 MB   May 19, 2026   👁️ 💾 │
│                                                               │
│  Legend:                                                      │
│  👁️ = Preview      💾 = Download      ☑️ = Selected          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 5️⃣ Document Preview Modal
```
┌───────────────────────────────────────────────────────────────┐
│  passport_photo.jpg                          💾 Download  ❌  │
│  1.2 MB                                                       │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                    [Image Preview]                            │
│                    ┌─────────────┐                            │
│                    │             │                            │
│                    │   Passport  │                            │
│                    │    Photo    │                            │
│                    │             │                            │
│                    └─────────────┘                            │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Actions

### Upload Documents (Guest - RSVP Form)
1. Fill out Steps 1-3 of RSVP form
2. In Step 4, click "Click to upload documents"
3. Select files (hold Ctrl/Cmd for multiple)
4. Review and remove any unwanted files
5. Submit form

### View Documents (Admin - Guest List)
1. Go to Guest List page
2. Find guest row
3. Click "Link" in Documents column
4. Modal opens with all documents

### Download Documents
**Single:** Click 💾 icon in list view or click document in grid view then download

**Multiple:** 
1. Select checkboxes for desired documents
2. Click "Download Selected" button

**All:** Click "Download All as Zip" button

### Upload Documents (Admin)
1. Open Documents Modal for guest
2. Click "Upload Documents" button
3. Select files
4. Files are automatically saved

### Delete Documents
1. Select documents using checkboxes
2. Click "Delete Selected" button
3. Confirm deletion

---

## 🔧 Technical Details

### Supported File Types
- **Images:** JPG, JPEG, PNG, WEBP, GIF, BMP
- **Documents:** PDF

### File Size Limit
- Maximum: **10 MB per file**
- No limit on number of files

### Storage
- Documents stored as **base64** in localStorage
- Automatically converted on upload
- Converted back to files on download

### Browser Support
- ✅ Chrome, Firefox, Safari, Edge (latest)
- ✅ All modern browsers with FileReader API
- ✅ Works offline (localStorage)

---

## 🎨 UI/UX Features

### Visual Indicators
- **Blue border** = Selected document
- **Green badge** = Successfully uploaded
- **Link (3)** = 3 documents available
- **—** = No documents (click to upload)

### View Modes
- **Grid:** Visual thumbnails, better for images
- **List:** Detailed info, better for managing many files

### Smart Features
- Auto-refresh after upload/delete
- Preview images inline
- Preview PDFs in browser
- File type icons
- Human-readable file sizes
- Upload date tracking

---

## ⚠️ Important Notes

1. **Storage Limit:** Browser localStorage typically allows 5-10MB total
2. **Zip Download:** Files download individually with guest name prefix
3. **Preview:** PDFs require browser with built-in PDF viewer
4. **Offline:** Works completely offline (no internet needed)

---

## 🐛 Troubleshooting

### Document not uploading?
- Check file size (max 10MB)
- Verify file type (images or PDF only)
- Check browser console for errors

### Can't see documents?
- Verify documents were saved (check Documents column)
- Try refreshing the page
- Check localStorage (Browser DevTools)

### Download not working?
- Check browser allows downloads
- Try different browser
- Check browser console for errors

---

## 📞 Support

Need help? Check:
1. Browser console (F12)
2. Implementation guide: DOCUMENT_MANAGEMENT_IMPLEMENTATION.md
3. File validation error messages

---

**🎉 Ready to use! Start uploading documents in your RSVP form or manage them from the Guest List.**
