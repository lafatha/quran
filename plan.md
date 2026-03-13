Iya, jujur aja: progress sekarang belum solid kalau targetmu adalah data yang benar-benar trustworthy antara home dan halaman Progress.
Aku sudah cek:
- home di app/page.tsx:354
- halaman progress di app/progress/page.tsx:68
- write logic di lib/supabase/reading.ts:28
- schema tabel di lib/supabase/database.ts:96, lib/supabase/database.ts:162, lib/supabase/database.ts:198, lib/supabase/database.ts:225
Yang sekarang sudah ada:
- reading_progress: simpan status per surah user
- daily_logs: agregat harian (ayat_read, surah_read, halaman_read, minutes_read)
- streaks: streak harian
- user_goals: target user
Masalah utamanya:
- daily_logs ditambah setiap kali markSurahAsRead() dipanggil di lib/supabase/reading.ts:45, jadi kalau user mark surah yang sama lagi, total harian bisa dobel
- markSurahAsUnread() di lib/supabase/reading.ts:108 cuma ubah reading_progress, tapi tidak rollback daily_logs dan streaks
- continue reading di home pakai reading_progress.last_ayat_read dari row paling baru di app/page.tsx:386, padahal nilai ini sekarang lebih mirip “surah yang terakhir ditandai selesai”, bukan “posisi terakhir user baca”
- chart di app/progress/page.tsx:105 mengubah ayat jadi juz pakai ayat / 148; ini jujur tidak valid secara domain
- currentJuz di app/progress/page.tsx:122 pakai completedCount / 4; ini juga tidak akurat
- average harian di app/progress/page.tsx:114 dihitung dari hari yang punya log saja, jadi bisa terlihat lebih bagus dari realita
- WeeklyCalendarStrip mendukung progress, tapi home sekarang cuma kirim status hari tanpa progres numerik di app/page.tsx:139, jadi visual weekly progress belum benar-benar dimanfaatkan
Lebih jujur lagi:
- dari DB saat ini, daily_logs dan reading_progress masih 0 rows, jadi fondasinya belum benar-benar kepakai luas atau belum terisi konsisten
- artinya ini momen yang bagus buat benerin model sebelum datanya banyak
Rekomendasi best practice yang paling aman
- Sumber kebenaran utama
  - jangan jadikan daily_logs sebagai source of truth
  - bikin tabel event / session, misalnya reading_sessions
- Pisahkan 2 konsep
  - reading_state: posisi terakhir baca per surah
  - reading_sessions: histori aktivitas baca yang immutable
- daily_logs tetap boleh ada
  - tapi statusnya tabel turunan / summary, bukan data primer
Struktur yang aku sarankan
- reading_state
  - user_id
  - surah_id
  - last_ayat_read
  - max_ayat_read
  - is_completed
  - completed_at
  - last_read_at
- reading_sessions
  - id
  - user_id
  - surah_id
  - session_date
  - started_at
  - ended_at
  - from_ayat
  - to_ayat
  - verses_read
  - pages_read
  - minutes_read
  - source (reader, resume, manual_complete, dll)
  - optional idempotency_key
- daily_logs
  - tetap dipakai untuk cache summary harian:
  - user_id, date, ayat_read, surah_read, halaman_read, minutes_read
  - tapi nilainya dihasilkan dari reading_sessions
Flow yang aku sarankan
- saat user pindah ayat / stop membaca / selesai surah:
  - insert 1 row ke reading_sessions
  - update reading_state
  - update/rebuild daily_logs
  - update streaks
- semua itu idealnya lewat 1 RPC / transaction di database, bukan beberapa query client terpisah
Kenapa ini lebih benar:
- home dan progress baca sumber definisi yang sama
- resume position tidak bentrok dengan completion status
- analytics bisa di-recompute kalau nanti logic berubah
- dobel count bisa dicegah
- “unread” bisa diperlakukan jelas, bukan bikin data summary setengah rusak
Kalau kamu tanya “apa definisi yang paling sehat untuk tiap layar?”:
- Home
  - Progress Hari Ini: dari daily_logs hasil turunan reading_sessions hari ini
  - Lanjut Baca: dari reading_state.last_read_at + last_ayat_read
  - weekly strip: dari persen target harian (ayat_read / ayat_goal) per tanggal
- Progress page
  - chart: pakai total ayat_read atau minutes_read per hari/minggu/bulan
  - overall completion: hitung dari total ayat unik yang sudah selesai / state completion yang valid
  - jangan pakai rumus completedSurah / 4 untuk juz
  - kalau mau tampil juz, harus mapping surah+ayat ke juz sungguhan
Prioritas implementasi yang paling aku rekomendasikan:
1. perbaiki model write dulu: buat reading_state + reading_sessions
2. pindahkan update progress ke RPC/transaction
3. ubah home agar continue reading ambil dari reading_state
4. ubah halaman progress agar chart pakai reading_sessions/daily_logs, bukan estimasi juz palsu
5. baru setelah itu rapikan streak dan weekly progress ring
Kalau mau, next aku bisa lanjut bikin untukmu:
1. desain schema final Supabase yang rapi
2. migration SQL lengkap
3. RPC function untuk track_reading_session
4. refactor home + progress supaya keduanya pakai model baru yang benar