import { useState } from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';

const COUNTRIES = [
  { c: 'EE', dial: '+372' }, { c: 'RU', dial: '+7' }, { c: 'FI', dial: '+358' },
  { c: 'LV', dial: '+371' }, { c: 'LT', dial: '+370' }, { c: 'BY', dial: '+375' },
  { c: 'UA', dial: '+380' }, { c: 'NO', dial: '+47' }, { c: 'AT', dial: '+43' },
  { c: 'AU', dial: '+61' }, { c: 'AZ', dial: '+994' }, { c: 'BE', dial: '+32' },
  { c: 'BG', dial: '+359' }, { c: 'BR', dial: '+55' }, { c: 'CA', dial: '+1' },
  { c: 'CH', dial: '+41' }, { c: 'CN', dial: '+86' }, { c: 'CZ', dial: '+420' },
  { c: 'DE', dial: '+49' }, { c: 'DK', dial: '+45' }, { c: 'ES', dial: '+34' },
  { c: 'FR', dial: '+33' }, { c: 'GB', dial: '+44' }, { c: 'GE', dial: '+995' },
  { c: 'GR', dial: '+30' }, { c: 'HR', dial: '+385' }, { c: 'HU', dial: '+36' },
  { c: 'IE', dial: '+353' }, { c: 'IL', dial: '+972' }, { c: 'IN', dial: '+91' },
  { c: 'IT', dial: '+39' }, { c: 'JP', dial: '+81' }, { c: 'KG', dial: '+996' },
  { c: 'KZ', dial: '+7' },  { c: 'MD', dial: '+373' }, { c: 'MX', dial: '+52' },
  { c: 'NL', dial: '+31' }, { c: 'NZ', dial: '+64' }, { c: 'PL', dial: '+48' },
  { c: 'PT', dial: '+351' }, { c: 'RO', dial: '+40' }, { c: 'RS', dial: '+381' },
  { c: 'SE', dial: '+46' }, { c: 'SI', dial: '+386' }, { c: 'SK', dial: '+421' },
  { c: 'TR', dial: '+90' }, { c: 'US', dial: '+1' }, { c: 'UZ', dial: '+998' },
];

const GRADES: Record<Language, string[]> = {
  en: ['Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
       'Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12','Adult'],
  et: ['Lasteaed','1. klass','2. klass','3. klass','4. klass','5. klass','6. klass',
       '7. klass','8. klass','9. klass','10. klass','11. klass','12. klass','Täiskasvanu'],
  ru: ['Детский сад','1 класс','2 класс','3 класс','4 класс','5 класс','6 класс','7 класс',
       '8 класс','9 класс','10 класс','11 класс','12 класс','Взрослый'],
};

const SUBJECT_LABELS: Record<Language, Record<string, string>> = {
  en: { Russian: 'Russian', English: 'English', Estonian: 'Estonian', Spanish: 'Spanish', Math: 'Math' },
  et: { Russian: 'Vene keel', English: 'Inglise keel', Estonian: 'Eesti keel', Spanish: 'Hispaania keel', Math: 'Matemaatika' },
  ru: { Russian: 'Русский', English: 'Английский', Estonian: 'Эстонский', Spanish: 'Испанский', Math: 'Математика' },
};

const TG_COUNTRIES = new Set([
  // CIS
  'RU', 'BY', 'UA', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'AZ', 'AM', 'GE', 'MD',
  // Baltic
  'EE', 'LV', 'LT',
  // Eastern Europe
  'PL', 'RO', 'BG', 'RS', 'HU', 'CZ', 'SK', 'HR', 'BA', 'ME', 'MK', 'AL',
]);

const LEARNING_LANG_OPTIONS: Record<Language, Record<string, string>> = {
  en: { en: 'English', ru: 'Russian', et: 'Estonian' },
  et: { en: 'Inglise keel', ru: 'Vene keel', et: 'Eesti keel' },
  ru: { en: 'Английский', ru: 'Русский', et: 'Эстонский' },
};

const FT = {
  en: {
    name: 'Full Name', email: 'Email', phone: 'Phone Number',
    subject: 'Subject', subjectDefault: 'Select a subject',
    grade: 'Current Grade / Level', gradeDefault: 'Select your grade',
    learningLang: 'Preferred Teaching Language', learningLangDefault: 'Select a language',
    contact: 'Preferred Contact',
    tgUsername: 'Your Telegram username',
    minor: 'I am a minor (under 18)',
    parentSection: 'Parent / Guardian',
    parentName: 'Parent Name', parentPhone: 'Parent Phone',
    parentEmail: 'Parent Email (optional)',
    parentContact: 'Parent Preferred Contact',
    parentTgUsername: "Parent's Telegram username",
    submit: 'Send Application',
    respondNote: 'We typically respond within 1-2 business days.',
    errRequired: 'This field is required.',
    errEmail: 'Please enter a valid email address.',
    errPhone: 'Please enter a valid phone number.',
    errTg: 'Please enter your Telegram username.',
    errParentTg: "Please enter the parent's Telegram username.",
    successTitle: 'Application Received!',
    successMsg: 'Thank you! We will review your application and reach out to you via your preferred channel.',
    serverErr: 'Something went wrong. Please try again.',
  },
  et: {
    name: 'Täisnimi', email: 'E-post', phone: 'Telefoninumber',
    subject: 'Õppeaine', subjectDefault: 'Vali õppeaine',
    grade: 'Praegune klass / tase', gradeDefault: 'Vali oma klass',
    learningLang: 'Eelistatud õppekeel', learningLangDefault: 'Vali keel',
    contact: 'Eelistatud kontakt',
    tgUsername: 'Sinu Telegrami kasutajanimi',
    minor: 'Olen alaealine (alla 18)',
    parentSection: 'Lapsevanem / eestkostja',
    parentName: 'Lapsevanema nimi', parentPhone: 'Lapsevanema telefon',
    parentEmail: 'Lapsevanema e-post (valikuline)',
    parentContact: 'Lapsevanema eelistatud kontakt',
    parentTgUsername: 'Lapsevanema Telegrami kasutajanimi',
    submit: 'Saada avaldus',
    respondNote: 'Vastame tavaliselt 1-2 tööpäeva jooksul.',
    errRequired: 'See väli on kohustuslik.',
    errEmail: 'Palun sisesta kehtiv e-posti aadress.',
    errPhone: 'Palun sisesta kehtiv telefoninumber.',
    errTg: 'Palun sisesta oma Telegrami kasutajanimi.',
    errParentTg: 'Palun sisesta lapsevanema Telegrami kasutajanimi.',
    successTitle: 'Avaldus vastu võetud!',
    successMsg: 'Täname! Vaatame teie avalduse läbi ja võtame teiega ühendust eelistatud kanali kaudu.',
    serverErr: 'Midagi läks valesti. Palun proovi uuesti.',
  },
  ru: {
    name: 'Полное имя', email: 'Email', phone: 'Номер телефона',
    subject: 'Предмет', subjectDefault: 'Выберите предмет',
    grade: 'Текущий класс / уровень', gradeDefault: 'Выберите класс',
    learningLang: 'Предпочтительный язык обучения', learningLangDefault: 'Выберите язык',
    contact: 'Предпочтительный способ связи',
    tgUsername: 'Ваш Telegram username',
    minor: 'Я несовершеннолетний (до 18 лет)',
    parentSection: 'Родитель / опекун',
    parentName: 'Имя родителя', parentPhone: 'Телефон родителя',
    parentEmail: 'Email родителя (необязательно)',
    parentContact: 'Способ связи с родителем',
    parentTgUsername: 'Telegram username родителя',
    submit: 'Отправить заявку',
    respondNote: 'Мы обычно отвечаем в течение 1-2 рабочих дней.',
    errRequired: 'Это поле обязательно.',
    errEmail: 'Пожалуйста, введите корректный email.',
    errPhone: 'Пожалуйста, введите корректный номер телефона.',
    errTg: 'Пожалуйста, укажите ваш Telegram username.',
    errParentTg: 'Пожалуйста, укажите Telegram username родителя.',
    successTitle: 'Заявка получена!',
    successMsg: 'Спасибо! Мы рассмотрим вашу заявку и свяжемся с вами через предпочтительный канал.',
    serverErr: 'Что-то пошло не так. Пожалуйста, попробуйте снова.',
  },
};

function PhoneInput({ id, country, onCountry, local, onLocal, hasError }: {
  id: string;
  country: string;
  onCountry: (c: string) => void;
  local: string;
  onLocal: (v: string) => void;
  hasError: boolean;
}) {
  const borderCls = hasError ? 'border-red-400' : 'border-border';
  return (
    <div className="flex gap-2">
      <select
        value={country}
        onChange={e => onCountry(e.target.value)}
        className={`px-3 py-3 rounded-xl border ${borderCls} bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm`}
        style={{ minWidth: '120px' }}
      >
        {COUNTRIES.map(({ c, dial }) => (
          <option key={c} value={c}>{c} {dial}</option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        value={local}
        onChange={e => onLocal(e.target.value.replace(/[^\d\s]/g, ''))}
        placeholder="12345678"
        className={`flex-1 px-4 py-3 rounded-xl border ${borderCls} bg-white focus:outline-none focus:ring-2 focus:ring-primary/50`}
      />
    </div>
  );
}

function PillGroup({ options, value, onChange }: {
  options: { val: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map(({ val, label }) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
            value === val
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-foreground border-border hover:border-primary/50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function ApplyForm() {
  const { language } = useLanguage();
  const t = FT[language];
  const subjects = Object.keys(SUBJECT_LABELS.en);
  const getDial = (c: string) => COUNTRIES.find(x => x.c === c)?.dial ?? '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('EE');
  const [localPhone, setLocalPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [learningLang, setLearningLang] = useState('');
  const [contactPref, setContactPref] = useState('');
  const [tgUsername, setTgUsername] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentCountry, setParentCountry] = useState('EE');
  const [parentLocal, setParentLocal] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPref, setParentPref] = useState('');
  const [parentTg, setParentTg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const showTgOption = TG_COUNTRIES.has(country) || learningLang === 'ru';
  const showParentTgOption = TG_COUNTRIES.has(parentCountry) || learningLang === 'ru';

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t.errRequired;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t.errEmail;
    if (localPhone.replace(/\D/g, '').length < 6) errs.phone = t.errPhone;
    if (!subject) errs.subject = t.errRequired;
    if (!grade) errs.grade = t.errRequired;
    if (!learningLang) errs.learningLang = t.errRequired;
    if (showTgOption && !contactPref) errs.contact = t.errRequired;
    if (showTgOption && contactPref === 'telegram' && !tgUsername.trim()) errs.tgUsername = t.errTg;
    if (isMinor) {
      if (!parentName.trim()) errs.parentName = t.errRequired;
      if (parentLocal.replace(/\D/g, '').length < 6) errs.parentPhone = t.errPhone;
      if (showParentTgOption && !parentPref) errs.parentContact = t.errRequired;
      if (showParentTgOption && parentPref === 'telegram' && !parentTg.trim()) errs.parentTg = t.errParentTg;
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const effectiveContactPref = showTgOption ? contactPref : 'email';
    const effectiveParentPref = showParentTgOption ? parentPref : 'email';

    setStatus('sending');
    try {
      const res = await fetch('https://booking.serfory.eu/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: `${getDial(country)} ${localPhone.trim()}`,
          country_code: country,
          subject,
          grade,
          learning_lang: learningLang,
          contact_pref: effectiveContactPref,
          telegram_username: effectiveContactPref === 'telegram' ? tgUsername.replace('@', '').trim() : '',
          is_minor: isMinor,
          parent_name: isMinor ? parentName.trim() : '',
          parent_contact: isMinor ? `${getDial(parentCountry)} ${parentLocal.trim()}` : '',
          parent_email: isMinor ? parentEmail.trim() : '',
          parent_pref: isMinor ? effectiveParentPref : '',
          telegram_parent_username: isMinor && effectiveParentPref === 'telegram' ? parentTg.replace('@', '').trim() : '',
          lang: language,
        }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-medium text-foreground mb-2">{t.successTitle}</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">{t.successMsg}</p>
      </div>
    );
  }

  const inputCls = (key: string) =>
    `w-full px-4 py-3 rounded-xl border ${errors[key] ? 'border-red-400' : 'border-border'} bg-white focus:outline-none focus:ring-2 focus:ring-primary/50`;

  const errMsg = (key: string) =>
    errors[key] ? <p className="text-xs text-red-500 mt-1">{errors[key]}</p> : null;

  const contactOptions = [
    { val: 'telegram', label: 'Telegram' },
    { val: 'email', label: 'Email' },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          {t.name} <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className={inputCls('name')}
        />
        {errMsg('name')}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          {t.email} <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputCls('email')}
        />
        {errMsg('email')}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          {t.phone} <span className="text-red-400">*</span>
        </label>
        <PhoneInput
          id="phone"
          country={country}
          onCountry={setCountry}
          local={localPhone}
          onLocal={setLocalPhone}
          hasError={!!errors.phone}
        />
        {errMsg('phone')}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          {t.subject} <span className="text-red-400">*</span>
        </label>
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className={inputCls('subject')}
        >
          <option value="">{t.subjectDefault}</option>
          {subjects.map(s => (
            <option key={s} value={s}>{SUBJECT_LABELS[language][s]}</option>
          ))}
        </select>
        {errMsg('subject')}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          {t.grade} <span className="text-red-400">*</span>
        </label>
        <select
          value={grade}
          onChange={e => setGrade(e.target.value)}
          className={inputCls('grade')}
        >
          <option value="">{t.gradeDefault}</option>
          {GRADES[language].map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        {errMsg('grade')}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          {t.learningLang} <span className="text-red-400">*</span>
        </label>
        <select
          value={learningLang}
          onChange={e => setLearningLang(e.target.value)}
          className={inputCls('learningLang')}
        >
          <option value="">{t.learningLangDefault}</option>
          {Object.entries(LEARNING_LANG_OPTIONS[language]).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        {errMsg('learningLang')}
      </div>

      {showTgOption && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t.contact} <span className="text-red-400">*</span>
          </label>
          <PillGroup options={contactOptions} value={contactPref} onChange={setContactPref} />
          {errMsg('contact')}
          {contactPref === 'telegram' && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-foreground mb-1">
                {t.tgUsername} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={tgUsername}
                onChange={e => setTgUsername(e.target.value)}
                placeholder="@username"
                className={inputCls('tgUsername')}
              />
              {errMsg('tgUsername')}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isMinor}
            onChange={e => setIsMinor(e.target.checked)}
            className="w-4 h-4 accent-primary rounded"
          />
          <span className="text-sm text-foreground">{t.minor}</span>
        </label>
      </div>

      {isMinor && (
        <div className="border border-border rounded-xl p-5 space-y-4 bg-white/40">
          <h3 className="text-sm font-semibold text-foreground">{t.parentSection}</h3>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t.parentName} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={parentName}
              onChange={e => setParentName(e.target.value)}
              className={inputCls('parentName')}
            />
            {errMsg('parentName')}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t.parentPhone} <span className="text-red-400">*</span>
            </label>
            <PhoneInput
              id="parent-phone"
              country={parentCountry}
              onCountry={setParentCountry}
              local={parentLocal}
              onLocal={setParentLocal}
              hasError={!!errors.parentPhone}
            />
            {errMsg('parentPhone')}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t.parentEmail}
            </label>
            <input
              type="email"
              value={parentEmail}
              onChange={e => setParentEmail(e.target.value)}
              className={inputCls('parentEmail')}
            />
          </div>

          {showParentTgOption && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t.parentContact} <span className="text-red-400">*</span>
              </label>
              <PillGroup options={contactOptions} value={parentPref} onChange={setParentPref} />
              {errMsg('parentContact')}
              {parentPref === 'telegram' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t.parentTgUsername} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={parentTg}
                    onChange={e => setParentTg(e.target.value)}
                    placeholder="@username"
                    className={inputCls('parentTg')}
                  />
                  {errMsg('parentTg')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <p className="text-sm text-red-500 text-center">{t.serverErr}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full px-6 py-3 bg-primary text-white rounded-full hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-60"
      >
        {status === 'sending' ? '...' : t.submit}
      </button>

      <p className="text-xs text-muted-foreground text-center">{t.respondNote}</p>
    </form>
  );
}
