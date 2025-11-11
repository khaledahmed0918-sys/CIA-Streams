import React, { useState, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDismiss: () => void;
  isDismissed: boolean;
}

const translations = {
  en: {
    title: 'Tutorial To Make An App',
    subtitle: 'This is a simple tutorial to how make cia streams site to an real usable app',
    instruction: 'Please do all at the bottom to make sure there is not any problems or missing steps',
    step1Title: '1. Click on The <strong>3 Points</strong>',
    step1Desc: 'Please click on the right/left <strong>3 Points</strong> to see site’s menu',
    step2Title: '2. <strong>Add to home screen</strong>',
    step2Desc: 'Click on “<strong>Add to home screen</strong>” to add the app',
    step3Title: '3. <strong>Install</strong> The App',
    step3Desc: 'Click on “<strong>Install</strong>” to install <strong>CIA Streams</strong> App',
    thanks: 'Thanks for supporting us.',
    dismiss: 'Dismiss',
    gotIt: 'Got it',
    android: 'Android/Samsung',
    iphone: 'iPhone',
  },
  ar: {
    title: 'شرح تحويل الموقع إلى تطبيق',
    subtitle: 'هذا شرح بسيط لكيفية تحويل موقع بثوث الـ CIA إلى تطبيق حقيقي قابل للاستخدام',
    instruction: 'يرجى اتباع جميع الخطوات بالأسفل للتأكد من عدم وجود أي مشاكل أو خطوات مفقودة',
    step1Title: '١. اضغط على <strong>الـ 3 نقاط</strong>',
    step1Desc: 'يرجى الضغط على <strong>الـ 3 نقاط</strong> في اليمين/اليسار لرؤية قائمة الموقع',
    step2Title: '٢. <strong>إضافة إلى الشاشة الرئيسية</strong>',
    step2Desc: 'اضغط على "<strong>إضافة إلى الشاشة الرئيسية</strong>" لإضافة التطبيق',
    step3Title: '٣. <strong>تثبيت</strong> التطبيق',
    step3Desc: 'اضغط على "<strong>تثبيت</strong>" لتثبيت تطبيق <strong>CIA Streams</strong>',
    thanks: 'شكراً لدعمكم.',
    dismiss: 'تجاهل',
    gotIt: 'فهمت',
    android: 'أندرويد/سامسونج',
    iphone: 'آيفون',
  }
};

const Step: React.FC<{
  title: string;
  description: string;
  img1Label: string;
  img1Src: string;
  img2Label: string;
  img2Src: string;
}> = ({ title, description, img1Label, img1Src, img2Label, img2Src }) => {
  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="mt-1 text-black/80 dark:text-white/80" dangerouslySetInnerHTML={{ __html: description }} />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <div className="text-center">
            <p className="font-semibold mb-2">{img1Label}</p>
            <img src={img1Src} alt={img1Label} className="w-full rounded-lg shadow-md border border-black/10 dark:border-white/10" />
        </div>
        <div className="text-center">
            <p className="font-semibold mb-2">{img2Label}</p>
            <img src={img2Src} alt={img2Label} className="w-full rounded-lg shadow-md border border-black/10 dark:border-white/10" />
        </div>
      </div>
    </div>
  );
};


export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, onDismiss, isDismissed }) => {
  const { language: initialAppLang } = useLocalization();
  const [lang, setLang] = useState<'en' | 'ar'>(initialAppLang);

  useEffect(() => {
    setLang(initialAppLang);
  }, [initialAppLang]);

  if (!isOpen) {
    return null;
  }

  const t = (key: keyof typeof translations.en) => translations[lang][key];
  const toggleLanguage = () => setLang(prev => (prev === 'en' ? 'ar' : 'en'));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-item-pop-in" style={{ animationDuration: '0.3s' }}>
      <div 
        className="w-full max-w-2xl max-h-[90vh] bg-slate-200/50 dark:bg-slate-900/50 border border-white/10 rounded-[25px] backdrop-blur-xl flex flex-col text-black dark:text-white shadow-2xl"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <header className="p-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-sm transition-colors"
            aria-label={`Switch to ${lang === 'en' ? 'Arabic' : 'English'}`}
          >
            <span className="font-bold text-lg">{lang === 'en' ? 'AR' : 'EN'}</span>
          </button>
        </header>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto">
            <p className="text-sm text-black/80 dark:text-white/80">{t('subtitle')}</p>
            <hr className="my-4 border-t border-gray-500/30" />
            <p className="text-base">{t('instruction')}</p>

            <Step 
                title={t('step1Title')}
                description={t('step1Desc')}
                img1Label={t('android')}
                img1Src="https://i.postimg.cc/02TmVvHc/Screenshot-Chrome.png"
                img2Label={t('iphone')}
                img2Src="https://i.postimg.cc/nrtKCJb2/IMG-8016.jpg"
            />
             <Step 
                title={t('step2Title')}
                description={t('step2Desc')}
                img1Label={t('android')}
                img1Src="https://i.postimg.cc/bNyN8BSZ/Screenshot-Chrome.png"
                img2Label={t('iphone')}
                img2Src="https://i.postimg.cc/KcnrCRBf/IMG-8017.jpg"
            />
             <Step 
                title={t('step3Title')}
                description={t('step3Desc')}
                img1Label={t('android')}
                img1Src="https://i.postimg.cc/B6f4zYGj/Screenshot-Chrome.png"
                img2Label={t('iphone')}
                img2Src="https://i.postimg.cc/NfD8fSJq/IMG-8018.jpg"
            />

            <p className="mt-8 text-center font-semibold">{t('thanks')}</p>

        </div>
        
        {/* Footer */}
        <footer className="p-4 mt-auto flex-shrink-0 flex justify-end gap-4">
            {!isDismissed && (
                <button 
                    onClick={onDismiss}
                    className="px-6 py-2 rounded-[30px] font-semibold transition-colors bg-black/10 dark:bg-white/10 backdrop-blur-sm hover:bg-black/20 dark:hover:bg-white/20"
                    style={{ background: 'rgba(255, 255, 255, 0.35)' }}
                >
                    {t('dismiss')}
                </button>
            )}
            <button 
                onClick={onClose}
                className="px-6 py-2 rounded-[30px] font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
                {t('gotIt')}
            </button>
        </footer>
      </div>
    </div>
  );
};
