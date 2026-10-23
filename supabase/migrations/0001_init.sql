-- ArabEasy Full-Stack MVP
-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Pelajar',
  role text not null default 'student' check (role in ('student','teacher','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  arabic text not null,
  description text not null default '',
  color text not null default '#e7f5ed',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null unique,
  title text not null,
  arabic text not null,
  level int not null default 1 check (level between 1 and 3),
  minutes int not null default 5 check (minutes between 1 and 180),
  summary text not null,
  content text not null,
  published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  arabic text not null,
  transliteration text not null default '',
  meaning text not null,
  example_ar text not null default '',
  example_id text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  material_id uuid references public.materials(id) on delete set null,
  prompt text not null,
  prompt_arabic text,
  hint text not null default '',
  explanation text not null default '',
  question_type text not null default 'meaning' check (question_type in ('meaning','arabic','grammar','sentence','matching')),
  level int not null default 1 check (level between 1 and 3),
  published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists one_correct_option_per_question
  on public.question_options(question_id) where is_correct = true;

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_slug text not null default 'all',
  score int not null check (score between 0 and 100),
  total_questions int not null check (total_questions > 0),
  correct_answers int not null check (correct_answers between 0 and total_questions),
  xp_earned int not null default 0 check (xp_earned >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_option_id uuid references public.question_options(id) on delete set null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table if not exists public.user_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, material_id)
);

create unique index if not exists vocabulary_material_arabic_unique
  on public.vocabulary(material_id, arabic, meaning);

create index if not exists materials_category_idx on public.materials(category_id);
create index if not exists materials_published_idx on public.materials(published);
create index if not exists questions_category_level_idx on public.questions(category_id, level, published);
create index if not exists attempts_user_date_idx on public.quiz_attempts(user_id, created_at desc);
create index if not exists progress_user_idx on public.user_progress(user_id);

-- Create profile automatically on registration.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'Pelajar'),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists materials_updated_at on public.materials;
create trigger materials_updated_at before update on public.materials for each row execute procedure public.set_updated_at();

-- Role helper: security definer prevents recursive profile RLS checks.
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','teacher'));
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.materials enable row level security;
alter table public.vocabulary enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.user_progress enable row level security;

-- Profiles: users can read/update only their own non-role fields; staff can read profiles.
drop policy if exists "profiles read own or staff" on public.profiles;
create policy "profiles read own or staff" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());
drop policy if exists "profiles update own basic profile" on public.profiles;
create policy "profiles update own basic profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Prevent learners from changing their role through the browser API.
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Categories are public to authenticated users; staff can manage them.
drop policy if exists "categories read authenticated" on public.categories;
create policy "categories read authenticated" on public.categories for select to authenticated using (true);
drop policy if exists "categories staff manage" on public.categories;
create policy "categories staff manage" on public.categories for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Published materials are readable by signed-in learners; staff manage all.
drop policy if exists "materials read published or staff" on public.materials;
create policy "materials read published or staff" on public.materials for select to authenticated using (published = true or public.is_staff());
drop policy if exists "materials staff manage" on public.materials;
create policy "materials staff manage" on public.materials for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "vocabulary read published or staff" on public.vocabulary;
create policy "vocabulary read published or staff" on public.vocabulary for select to authenticated using (
  public.is_staff() or exists (select 1 from public.materials m where m.id = material_id and m.published = true)
);
drop policy if exists "vocabulary staff manage" on public.vocabulary;
create policy "vocabulary staff manage" on public.vocabulary for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Important: question answer keys are never readable directly from browser clients.
-- Quiz reads/answer validation are performed only by server actions using service role.
drop policy if exists "questions staff read" on public.questions;
create policy "questions staff read" on public.questions for select to authenticated using (public.is_staff());
drop policy if exists "questions staff manage" on public.questions;
create policy "questions staff manage" on public.questions for all to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists "options staff read" on public.question_options;
create policy "options staff read" on public.question_options for select to authenticated using (public.is_staff());
drop policy if exists "options staff manage" on public.question_options;
create policy "options staff manage" on public.question_options for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "attempts read own or staff" on public.quiz_attempts;
create policy "attempts read own or staff" on public.quiz_attempts for select to authenticated using (user_id = auth.uid() or public.is_staff());
drop policy if exists "attempts insert own" on public.quiz_attempts;
create policy "attempts insert own" on public.quiz_attempts for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "answers read own or staff" on public.quiz_answers;
create policy "answers read own or staff" on public.quiz_answers for select to authenticated using (
  exists (select 1 from public.quiz_attempts a where a.id = attempt_id and (a.user_id = auth.uid() or public.is_staff()))
);
drop policy if exists "answers insert own attempt" on public.quiz_answers;
create policy "answers insert own attempt" on public.quiz_answers for insert to authenticated with check (
  exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);

drop policy if exists "progress read own or staff" on public.user_progress;
create policy "progress read own or staff" on public.user_progress for select to authenticated using (user_id = auth.uid() or public.is_staff());
drop policy if exists "progress insert own" on public.user_progress;
create policy "progress insert own" on public.user_progress for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "progress update own" on public.user_progress;
create policy "progress update own" on public.user_progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "progress delete own" on public.user_progress;
create policy "progress delete own" on public.user_progress for delete to authenticated using (user_id = auth.uid());

-- Seed categories.
insert into public.categories (slug,title,arabic,description,color,sort_order) values
('mufradat','Mufradat','الْمُفْرَدَات','Perkaya kosakata berdasarkan tema sehari-hari.','#e5f5eb',1),
('nahwu','Nahwu','النَّحْوُ','Pahami struktur dan fungsi kata dalam kalimat.','#f9f0dc',2),
('sharaf','Sharaf','الصَّرْفُ','Pelajari perubahan bentuk kata kerja.','#fcece4',3),
('hiwar','Hiwar','الْحِوَارُ','Latihan percakapan praktis dalam situasi nyata.','#e7effb',4)
on conflict (slug) do nothing;

-- Seed starter materials.
insert into public.materials (category_id,slug,title,arabic,level,minutes,summary,content,published)
select c.id, v.slug,v.title,v.arabic,v.level,v.minutes,v.summary,v.content,true
from (values
('mufradat','salam-perkenalan','Salam dan perkenalan','التَّحِيَّةُ وَالتَّعَارُفُ',1,5,'Ungkapan salam, menanyakan kabar, dan memperkenalkan diri.','Salam merupakan ungkapan pembuka yang umum dalam percakapan bahasa Arab. Gunakan أَهْلًا وَسَهْلًا untuk menyambut seseorang dan اِسْمِي untuk mengatakan nama saya.'),
('mufradat','keluarga','Kosakata keluarga','الْأُسْرَةُ',1,5,'Nama anggota keluarga dan penggunaannya dalam kalimat.','Kosakata keluarga sering digunakan bersama kata ganti kepemilikan. أَبِي berarti ayahku, sedangkan أُمِّي berarti ibuku.'),
('mufradat','sekolah-kampus','Sekolah dan kampus','الْمَدْرَسَةُ وَالْجَامِعَةُ',1,6,'Kosakata kelas, perpustakaan, guru, dan mahasiswa.','Perhatikan perbedaan طَالِبٌ (siswa/mahasiswa laki-laki) dan طَالِبَةٌ (siswa/mahasiswa perempuan).'),
('nahwu','isim-fiil-huruf','Isim, fiil, dan huruf','اِسْمٌ وَفِعْلٌ وَحَرْفٌ',1,7,'Mengenali tiga kelompok utama kata dalam bahasa Arab.','Isim menunjukkan nama atau makna tanpa terikat waktu; fiil menunjukkan pekerjaan yang terkait waktu; huruf memberi makna ketika bergabung dengan kata lain.'),
('nahwu','dhamir','Dhamir (kata ganti)','الضَّمَائِرُ',1,6,'Kata ganti orang pertama, kedua, dan ketiga.','Dhamir menggantikan isim yang telah diketahui. Contoh أَنَا (saya), أَنْتَ (kamu laki-laki), أَنْتِ (kamu perempuan), هُوَ (dia laki-laki), dan هِيَ (dia perempuan).'),
('sharaf','fiil-madhi','Fiil madhi','الْفِعْلُ الْمَاضِي',1,6,'Kata kerja untuk menyatakan perbuatan yang telah terjadi.','Fiil madhi pada contoh dasar كَتَبَ berarti dia laki-laki telah menulis. Akhiran dapat berubah mengikuti pelaku.'),
('sharaf','fiil-mudhari','Fiil mudhari','الْفِعْلُ الْمُضَارِعُ',2,7,'Kata kerja untuk aktivitas sekarang atau kebiasaan.','Bentuk mudhari sering menggunakan awalan أ، ن، ي، ت. Pilihan bentuk bergantung pada subjek dan konteks.'),
('hiwar','hiwar-perkenalan','Percakapan perkenalan','التَّعَارُفُ',1,5,'Memperkenalkan nama dan menanyakan kabar.','Perhatikan ungkapan مَا اسْمُكَ؟ untuk lawan bicara laki-laki dan مَا اسْمُكِ؟ untuk lawan bicara perempuan.'),
('hiwar','hiwar-kelas','Percakapan di kelas','فِي الْفَصْلِ',1,6,'Ungkapan sederhana untuk berinteraksi dengan guru di kelas.','Gunakan مِنْ فَضْلِكَ (tolong, kepada laki-laki) dan شُكْرًا (terima kasih) sebagai ungkapan sopan.'),
('hiwar','hiwar-arah','Bertanya arah','السُّؤَالُ عَنِ الطَّرِيقِ',2,7,'Menanyakan letak tempat dan memahami petunjuk arah.','Ungkapan أَيْنَ ...؟ berarti di mana. Kata يَمِينٌ berarti kanan dan يَسَارٌ berarti kiri.')
) as v(category_slug,slug,title,arabic,level,minutes,summary,content)
join public.categories c on c.slug=v.category_slug
on conflict (slug) do nothing;

-- Seed vocabulary attached to starter materials.
insert into public.vocabulary (material_id,arabic,transliteration,meaning,example_ar,example_id,sort_order)
select m.id,v.arabic,v.transliteration,v.meaning,v.example_ar,v.example_id,v.sort_order
from (values
('salam-perkenalan','السَّلَامُ عَلَيْكُمْ','as-salāmu ‘alaikum','Semoga keselamatan tercurah kepadamu','السَّلَامُ عَلَيْكُمْ يَا أَحْمَدُ','Salam sejahtera, Ahmad.',1),
('salam-perkenalan','مَا اسْمُكَ؟','mā ismuka?','Siapa namamu? (laki-laki)','مَا اسْمُكَ يَا عَلِيُّ؟','Siapa namamu, Ali?',2),
('salam-perkenalan','اِسْمِي أَحْمَدُ','ismī Aḥmadu','Nama saya Ahmad','اِسْمِي أَحْمَدُ.','Nama saya Ahmad.',3),
('keluarga','أَبٌ','abun','Ayah','هَذَا أَبِي.','Ini ayahku.',1),
('keluarga','أُمٌّ','ummun','Ibu','هَذِهِ أُمِّي.','Ini ibuku.',2),
('keluarga','أَخٌ','akhun','Saudara laki-laki','لِي أَخٌ وَاحِدٌ.','Saya memiliki satu saudara laki-laki.',3),
('sekolah-kampus','مَدْرَسَةٌ','madrasatun','Sekolah','هَذِهِ مَدْرَسَةٌ.','Ini adalah sekolah.',1),
('sekolah-kampus','جَامِعَةٌ','jāmi‘atun','Universitas','الْجَامِعَةُ كَبِيرَةٌ.','Universitas itu besar.',2),
('sekolah-kampus','كِتَابٌ','kitābun','Buku','هَذَا كِتَابٌ جَدِيدٌ.','Ini buku baru.',3),
('isim-fiil-huruf','كِتَابٌ','kitābun','Isim: buku','الْكِتَابُ جَدِيدٌ.','Buku itu baru.',1),
('isim-fiil-huruf','كَتَبَ','kataba','Fiil madhi: telah menulis','كَتَبَ عَلِيٌّ الدَّرْسَ.','Ali telah menulis pelajaran.',2),
('isim-fiil-huruf','فِي','fī','Huruf: di/dalam','الْقَلَمُ فِي الْحَقِيبَةِ.','Pulpen ada di dalam tas.',3),
('dhamir','أَنَا','anā','Saya','أَنَا طَالِبٌ.','Saya seorang siswa.',1),
('dhamir','أَنْتَ','anta','Kamu (laki-laki)','أَنْتَ مُجْتَهِدٌ.','Kamu rajin.',2),
('dhamir','هِيَ','hiya','Dia (perempuan)','هِيَ طَالِبَةٌ.','Dia seorang siswi.',3),
('fiil-madhi','كَتَبَ','kataba','Dia telah menulis','كَتَبَ الطَّالِبُ.','Siswa itu telah menulis.',1),
('fiil-madhi','كَتَبَتْ','katabat','Dia perempuan telah menulis','كَتَبَتْ فَاطِمَةُ.','Fatimah telah menulis.',2),
('fiil-mudhari','يَكْتُبُ','yaktubu','Dia sedang/akan menulis','يَكْتُبُ الطَّالِبُ.','Siswa itu sedang menulis.',1),
('fiil-mudhari','أَكْتُبُ','aktubu','Saya menulis','أَكْتُبُ الدَّرْسَ.','Saya menulis pelajaran.',2),
('hiwar-perkenalan','كَيْفَ حَالُكَ؟','kaifa ḥāluka?','Apa kabarmu? (laki-laki)','كَيْفَ حَالُكَ الْيَوْمَ؟','Apa kabarmu hari ini?',1),
('hiwar-perkenalan','أَنَا بِخَيْرٍ','anā bikhairin','Saya baik','أَنَا بِخَيْرٍ، الْحَمْدُ لِلَّهِ.','Saya baik, alhamdulillah.',2),
('hiwar-kelas','مِنْ فَضْلِكَ','min faḍlika','Tolong (kepada laki-laki)','مِنْ فَضْلِكَ، اِفْتَحِ الْكِتَابَ.','Tolong, bukalah buku.',1),
('hiwar-kelas','شُكْرًا','syukran','Terima kasih','شُكْرًا يَا أُسْتَاذُ.','Terima kasih, Pak Guru.',2),
('hiwar-arah','أَيْنَ؟','aina?','Di mana?','أَيْنَ الْمَكْتَبَةُ؟','Di mana perpustakaan?',1),
('hiwar-arah','قَرِيبٌ','qarībun','Dekat (maskulin)','الْمَكْتَبَةُ قَرِيبَةٌ.','Perpustakaan itu dekat.',2)
) as v(material_slug,arabic,transliteration,meaning,example_ar,example_id,sort_order)
join public.materials m on m.slug=v.material_slug
on conflict do nothing;

-- Starter question bank. Correct answers are intentionally not exposed by client RLS.
insert into public.questions (category_id,prompt,prompt_arabic,hint,explanation,question_type,level,published)
select c.id,q.prompt,q.prompt_arabic,q.hint,q.explanation,q.question_type,q.level,true
from (values
('mufradat','Apa arti مَدْرَسَةٌ?','مَدْرَسَةٌ','Pilih arti yang tepat.','مَدْرَسَةٌ (madrasatun) berarti sekolah.','meaning',1),
('mufradat','Apa arti كِتَابٌ?','كِتَابٌ','Pilih arti yang tepat.','كِتَابٌ (kitābun) berarti buku.','meaning',1),
('mufradat','Bahasa Arab untuk “rumah” adalah …',null,'Pilih kata Arab yang benar.','بَيْتٌ (baitun) berarti rumah.','arabic',1),
('mufradat','Apa arti أُمٌّ?','أُمٌّ','Pilih arti yang tepat.','أُمٌّ (ummun) berarti ibu.','meaning',1),
('mufradat','Kata Arab untuk “perpustakaan” adalah …',null,'Pilih kata Arab yang benar.','مَكْتَبَةٌ (maktabatun) berarti perpustakaan.','arabic',1),
('nahwu','Kata ganti untuk “saya” adalah …',null,'Kata ganti orang pertama tunggal.','أَنَا berarti saya.','grammar',1),
('nahwu','Kata tunjuk tunggal feminin yang dekat adalah …',null,'Contoh: … مَدْرَسَةٌ','هَذِهِ digunakan untuk kata benda tunggal feminin yang dekat.','grammar',1),
('nahwu','Pada الْبَيْتُ كَبِيرٌ, الْبَيْتُ berfungsi sebagai …','الْبَيْتُ كَبِيرٌ','Kalimat nominal sederhana.','الْبَيْتُ adalah mubtada, sedangkan كَبِيرٌ adalah khabar.','grammar',2),
('sharaf','Apa arti يَكْتُبُ?','يَكْتُبُ','Bentuk fiil mudhari.','يَكْتُبُ berarti dia sedang atau akan menulis.','meaning',1),
('sharaf','Bentuk mudhari dari كَتَبَ adalah …',null,'Dia sedang/akan menulis.','يَكْتُبُ adalah bentuk fiil mudhari dari كَتَبَ.','arabic',2),
('sharaf','Pilih fiil amr yang berarti “bacalah!”',null,'Bentuk perintah untuk satu laki-laki.','اِقْرَأْ (iqra) adalah fiil amr yang berarti bacalah!','arabic',2),
('hiwar','Apa arti مَا اسْمُكَ؟','مَا اسْمُكَ؟','Ungkapan saat berkenalan dengan laki-laki.','مَا اسْمُكَ؟ berarti siapa namamu? untuk lawan bicara laki-laki.','meaning',1),
('hiwar','Apa arti شُكْرًا?','شُكْرًا','Ungkapan sopan.','شُكْرًا (syukran) berarti terima kasih.','meaning',1),
('hiwar','Makna أَيْنَ الْمَكْتَبَةُ؟ adalah …','أَيْنَ الْمَكْتَبَةُ؟','Pertanyaan tentang lokasi.','أَيْنَ الْمَكْتَبَةُ؟ berarti di mana perpustakaan?','meaning',2)
) as q(category_slug,prompt,prompt_arabic,hint,explanation,question_type,level)
join public.categories c on c.slug=q.category_slug
where not exists (select 1 from public.questions existing where existing.prompt=q.prompt);

-- Add answer choices by matching the unique prompt.
insert into public.question_options (question_id,label,is_correct,sort_order)
select q.id,o.label,o.is_correct,o.sort_order
from (values
('Apa arti مَدْرَسَةٌ?','Rumah',false,1),('Apa arti مَدْرَسَةٌ?','Sekolah',true,2),('Apa arti مَدْرَسَةٌ?','Buku',false,3),('Apa arti مَدْرَسَةٌ?','Perpustakaan',false,4),
('Apa arti كِتَابٌ?','Pulpen',false,1),('Apa arti كِتَابٌ?','Pintu',false,2),('Apa arti كِتَابٌ?','Buku',true,3),('Apa arti كِتَابٌ?','Meja',false,4),
('Bahasa Arab untuk “rumah” adalah …','مَسْجِدٌ',false,1),('Bahasa Arab untuk “rumah” adalah …','بَيْتٌ',true,2),('Bahasa Arab untuk “rumah” adalah …','سُوقٌ',false,3),('Bahasa Arab untuk “rumah” adalah …','قَلَمٌ',false,4),
('Apa arti أُمٌّ?','Ayah',false,1),('Apa arti أُمٌّ?','Saudara laki-laki',false,2),('Apa arti أُمٌّ?','Nenek',false,3),('Apa arti أُمٌّ?','Ibu',true,4),
('Kata Arab untuk “perpustakaan” adalah …','مَكْتَبَةٌ',true,1),('Kata Arab untuk “perpustakaan” adalah …','مَدْرَسَةٌ',false,2),('Kata Arab untuk “perpustakaan” adalah …','مَطْعَمٌ',false,3),('Kata Arab untuk “perpustakaan” adalah …','نَافِذَةٌ',false,4),
('Kata ganti untuk “saya” adalah …','هُوَ',false,1),('Kata ganti untuk “saya” adalah …','أَنْتَ',false,2),('Kata ganti untuk “saya” adalah …','أَنَا',true,3),('Kata ganti untuk “saya” adalah …','هِيَ',false,4),
('Kata tunjuk tunggal feminin yang dekat adalah …','هَذَا',false,1),('Kata tunjuk tunggal feminin yang dekat adalah …','هَذِهِ',true,2),('Kata tunjuk tunggal feminin yang dekat adalah …','ذَلِكَ',false,3),('Kata tunjuk tunggal feminin yang dekat adalah …','هُوَ',false,4),
('Pada الْبَيْتُ كَبِيرٌ, الْبَيْتُ berfungsi sebagai …','Fiil',false,1),('Pada الْبَيْتُ كَبِيرٌ, الْبَيْتُ berfungsi sebagai …','Huruf',false,2),('Pada الْبَيْتُ كَبِيرٌ, الْبَيْتُ berfungsi sebagai …','Mubtada',true,3),('Pada الْبَيْتُ كَبِيرٌ, الْبَيْتُ berfungsi sebagai …','Khabar',false,4),
('Apa arti يَكْتُبُ?','Tulislah!',false,1),('Apa arti يَكْتُبُ?','Dia telah menulis',false,2),('Apa arti يَكْتُبُ?','Dia sedang/akan menulis',true,3),('Apa arti يَكْتُبُ?','Buku',false,4),
('Bentuk mudhari dari كَتَبَ adalah …','اُكْتُبْ',false,1),('Bentuk mudhari dari كَتَبَ adalah …','يَكْتُبُ',true,2),('Bentuk mudhari dari كَتَبَ adalah …','كَاتِبٌ',false,3),('Bentuk mudhari dari كَتَبَ adalah …','كِتَابٌ',false,4),
('Pilih fiil amr yang berarti “bacalah!”','قَرَأَ',false,1),('Pilih fiil amr yang berarti “bacalah!”','يَقْرَأُ',false,2),('Pilih fiil amr yang berarti “bacalah!”','اِقْرَأْ',true,3),('Pilih fiil amr yang berarti “bacalah!”','قِرَاءَةٌ',false,4),
('Apa arti مَا اسْمُكَ؟','Apa kabarmu?',false,1),('Apa arti مَا اسْمُكَ؟','Siapa namamu?',true,2),('Apa arti مَا اسْمُكَ؟','Di mana rumahmu?',false,3),('Apa arti مَا اسْمُكَ؟','Berapa harganya?',false,4),
('Apa arti شُكْرًا?','Permisi',false,1),('Apa arti شُكْرًا?','Selamat pagi',false,2),('Apa arti شُكْرًا?','Terima kasih',true,3),('Apa arti شُكْرًا?','Sampai jumpa',false,4),
('Makna أَيْنَ الْمَكْتَبَةُ؟ adalah …','Kapan perpustakaan buka?',false,1),('Makna أَيْنَ الْمَكْتَبَةُ؟ adalah …','Di mana perpustakaan?',true,2),('Makna أَيْنَ الْمَكْتَبَةُ؟ adalah …','Siapa penjaga perpustakaan?',false,3),('Makna أَيْنَ الْمَكْتَبَةُ؟ adalah …','Berapa harga buku?',false,4)
) as o(prompt,label,is_correct,sort_order)
join public.questions q on q.prompt=o.prompt
where not exists (select 1 from public.question_options qo where qo.question_id=q.id and qo.label=o.label);
