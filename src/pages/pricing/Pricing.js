import React from 'react';
import Navbar from '../../components/navbar/Navbar';
import './Pricing.css';
import '../../reusable.css';
import { 
  CheckCircle2, 
  Sparkles, 
  School, 
  Users, 
  Zap, 
  MessageSquare, 
  ShieldCheck, 
  CreditCard,
  PhoneCall,
  Crown
} from 'lucide-react';
import { safeLocalStorage } from '../../utils/safeStorage';

function Pricing() {
  const currentUsername = safeLocalStorage.getItem('pp_name') || safeLocalStorage.getItem('userName') || '';

  const getWhatsAppLink = (planName, price) => {
    const userText = currentUsername ? ` (اسم المستخدم: ${currentUsername})` : '';
    const message = encodeURIComponent(`مرحباً أبطال الحساب الذهني! أود الاشتراك في ${planName} بقيمة ${price} جنيه${userText}. برجاء تزويدي بتفاصيل الدفع.`);
    return `https://wa.me/201505252676?text=${message}`;
  };

  const getTeacherWhatsAppLink = () => {
    const userText = currentUsername ? ` (اسم المستخدم: ${currentUsername})` : '';
    const message = encodeURIComponent(`مرحباً! أنا معلم/صاحب أكاديمية وأود الحصول على عرض المجموعات لأكثر من 10 طلاب على منصة أبطال الحساب الذهني${userText}.`);
    return `https://wa.me/201505252676?text=${message}`;
  };

  return (
    <div className="pricing-page-new">
      <Navbar />

      <div className="pricing-container">
        {/* Header */}
        <div className="pricing-header">
          <div className="pricing-pill">
            <Sparkles size={16} /> خطط وأسعار الاشتراك الجديدة 2026
          </div>
          <h1>اختر الباقة المناسبة وانطلق في عالم عباقرة الحساب الذهني 🚀</h1>
          <p>تدريب لا محدود، واجبات تفاعلية، ألعاب حماسية، ومسابقات جماعية مباشرة</p>
        </div>

        {/* 3 Core Pricing Cards */}
        <div className="pricing-cards-grid">
          
          {/* Card 1: Monthly */}
          <div className="pricing-card">
            <div className="card-top">
              <div className="plan-icon plan-icon-blue">
                <Zap size={28} />
              </div>
              <h3 className="plan-title">الباقة الشهرية</h3>
              <p className="plan-subtitle">مرونة شهرية كاملة بدون التزام طويل</p>
              
              <div className="price-tag">
                <span className="currency">EGP</span>
                <span className="amount">100</span>
                <span className="period">/ شهرياً</span>
              </div>
            </div>

            <ul className="plan-features">
              <li><CheckCircle2 size={18} className="feat-check" /> تدريب يومي لا محدود على جميع المستويات</li>
              <li><CheckCircle2 size={18} className="feat-check" /> حل الواجبات التفاعلية والأنشطة</li>
              <li><CheckCircle2 size={18} className="feat-check" /> ألعاب الحساب الذهني الفردية والممتعة</li>
              <li><CheckCircle2 size={18} className="feat-check" /> تقارير وإحصائيات الأداء الشخصي</li>
              <li><CheckCircle2 size={18} className="feat-check" /> دعم فني عبر الواتساب</li>
            </ul>

            <a 
              href={getWhatsAppLink('الباقة الشهرية', '100')} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="pricing-cta-btn btn-monthly"
            >
              <MessageSquare size={18} /> اشترك الآن عبر واتساب
            </a>
          </div>

          {/* Card 2: 3 Months / School Term (Featured) */}
          <div className="pricing-card featured-card">
            <div className="popular-badge">
              ⭐ الأكثر طلباً - باقة الترم الدراسي
            </div>

            <div className="card-top">
              <div className="plan-icon plan-icon-purple">
                <Crown size={28} />
              </div>
              <h3 className="plan-title">باقة الترم الدراسي (3 شهور)</h3>
              <p className="plan-subtitle">الخيار الأمثل لمتابعة الفصل الدراسي بأعلى توفير</p>
              
              <div className="price-tag">
                <span className="currency">EGP</span>
                <span className="amount">200</span>
                <span className="period">/ 3 شهور</span>
              </div>
              <div className="savings-badge">
                وفر 100 جنيه (فقط 67 جنيه شهرياً!)
              </div>
            </div>

            <ul className="plan-features">
              <li><CheckCircle2 size={18} className="feat-check" /> <strong>كل مميزات الباقة الشهرية لمدة 3 شهور</strong></li>
              <li><CheckCircle2 size={18} className="feat-check" /> المشاركة في مسابقات المنصة والسباقات الحية</li>
              <li><CheckCircle2 size={18} className="feat-check" /> متجر الجوائز وفتح شخصيات وسيارات السباق</li>
              <li><CheckCircle2 size={18} className="feat-check" /> تقرير شامل لتطور السرعة والدقة مع نهاية الترم</li>
              <li><CheckCircle2 size={18} className="feat-check" /> تفعيل فوري مع خدمة عملاء مخصصة</li>
            </ul>

            <a 
              href={getWhatsAppLink('باقة الترم الدراسي (3 شهور)', '200')} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="pricing-cta-btn btn-featured"
            >
              <MessageSquare size={20} /> اشترك في باقة الترم (وفر 33%)
            </a>
          </div>

          {/* Card 3: Yearly */}
          <div className="pricing-card">
            <div className="best-value-badge">
              🏆 أفضل قيمة - خصم 50%
            </div>

            <div className="card-top">
              <div className="plan-icon plan-icon-gold">
                <Sparkles size={28} />
              </div>
              <h3 className="plan-title">الباقة السنوية (سنة كاملة)</h3>
              <p className="plan-subtitle">عام كامل من الاحتراف والتفوق بأفضل سعر إطلاقاً</p>
              
              <div className="price-tag">
                <span className="currency">EGP</span>
                <span className="amount">600</span>
                <span className="period">/ سنوياً</span>
              </div>
              <div className="savings-badge savings-gold">
                وفر 600 جنيه (فقط 50 جنيه شهرياً!)
              </div>
            </div>

            <ul className="plan-features">
              <li><CheckCircle2 size={18} className="feat-check" /> <strong>سنة كاملة (12 شهراً) من الوصول غير المحدود</strong></li>
              <li><CheckCircle2 size={18} className="feat-check" /> جميع ألعاب المنصة والمسابقات الحية التنافسية</li>
              <li><CheckCircle2 size={18} className="feat-check" /> هدية 1000 نقطة ذهبية في متجر الأبطال فوراً</li>
              <li><CheckCircle2 size={18} className="feat-check" /> شهادة تقدير سنوية رسمية معتمدة من المنصة</li>
              <li><CheckCircle2 size={18} className="feat-check" /> أولوية في التحديثات والميزات الجديدة</li>
            </ul>

            <a 
              href={getWhatsAppLink('الباقة السنوية (سنة كاملة)', '600')} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="pricing-cta-btn btn-annual"
            >
              <MessageSquare size={18} /> اشترك في الباقة السنوية (وفر 50%)
            </a>
          </div>

        </div>

        {/* Special Teacher & Academy Banner */}
        <div className="teacher-group-banner">
          <div className="banner-left">
            <div className="teacher-badge">
              <School size={22} /> باقة المعلمين والأكاديميات
            </div>
            <h2>معلم أو صاحب أكاديمية؟ لديك أكثر من 10 طلاب؟ 🎓</h2>
            <p>
              نوفر عروضاً خاصة وأسعار مخفضة للغاية تبدأ عند الاشتراك بـ 10 طلاب أو أكثر، 
              مع لوحة تحكم مخصصة لإدارة الفصول، إنشاء الواجبات، ومتابعة درجات كل طالب لحظة بلحظة.
            </p>
            <div className="group-perks">
              <span><CheckCircle2 size={16} /> خصومات تصاعدية للمجموعات الكبيرة</span>
              <span><CheckCircle2 size={16} /> لوحة تحكم متكاملة للمعلم</span>
              <span><CheckCircle2 size={16} /> مسابقات حية خاصة لطلابك</span>
            </div>
          </div>
          <div className="banner-right">
            <a 
              href={getTeacherWhatsAppLink()} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="teacher-contact-btn"
            >
              <Users size={20} /> تواصل للحصول على عرض المجموعات
            </a>
          </div>
        </div>

        {/* Payment Methods & Guarantee */}
        <div className="payment-methods-box">
          <div className="payment-title">
            <CreditCard size={20} /> طرق الدفع المتاحة وسهلة في مصر
          </div>
          <div className="payment-badges-row">
            <div className="pay-badge"><span className="pay-dot vodafone"></span> فودافون كاش (Vodafone Cash)</div>
            <div className="pay-badge"><span className="pay-dot instapay"></span> إنستاباي (InstaPay)</div>
            <div className="pay-badge"><span className="pay-dot card"></span> فيزا / ماستركارد (Cards)</div>
            <div className="pay-badge"><span className="pay-dot fawry"></span> فوري وأمان (Fawry)</div>
          </div>
          <p className="activation-note">
            ⚡ يتم تفعيل الحساب فور إرسال إيصال التحويل عبر الواتساب في أقل من 5 دقائق!
          </p>
          <div className="support-direct">
            لأي استفسار أو تفعيل مباشر عبر الهاتف / واتساب: 
            <a href="tel:+201505252676" dir="ltr" className="tel-link"> +20 150 525 2676</a>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Pricing;