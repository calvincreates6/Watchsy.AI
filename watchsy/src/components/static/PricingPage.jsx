import React, { useState } from 'react';
import Header from '../subcomps/Header';
import Footer from '../subcomps/Footer';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'

  const subscriptionPlans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Great for casual viewers who just want to keep track of movies',
      price: { monthly: 0, yearly: 0 },
      features: [
        'Watchlist and Liked List',
        'Access to movie ott streams details & trailers',
        'Share with friends',
        'Heatmap and streaks',
        'Upto 10 AI Recommendations',

      ],
      limitations: [
        'No AI personalization',
        'Standard search filters and recommendations only',
        'Ads included'
      ],
      popular: false,
      color: '#6b7280'
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Perfect for movie lovers who want deeper insights',
      price: { monthly: 4.99, yearly: 49.99 },
      features: [
        'EVERYTHING IN FREE',
        'No Ads',
        'upto 40 AI Recommendations',
        'Customizable Lists',
        'Movie stats and insights',
        'Watched movies genre breakdown',
        'Priority email support'
      ],
      limitations: [],
      popular: true,
      color: '#ffd93d'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'For hardcore cinephiles who want the ultimate experience',
      price: { monthly: 8.99, yearly: 89.99 },
      features: [
        'EVERYTHING IN PRO',
        'Early access to new features',
        'upto 100 AI Recommendations',
        'In-depth movie insights & stats',
        'Personalized AI-powered curator',
        'Watched movies genre breakdown',

      ],
      limitations: [],
      popular: false,
      color: '#FF1D68'
    }
  ];
  

  const handleSubscribe = (planId) => {
    // TODO: Implement subscription logic
    console.log(`Subscribing to ${planId} plan (${billingCycle})`);
    // This would typically integrate with a payment processor like Stripe
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  const getSavings = (monthlyPrice, yearlyPrice) => {
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - yearlyPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { savings, percentage };
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #2d3748 100%)',
      color: '#ffffff'
    }}>
      <Header onSearch={() => {}} />
      
      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '40px 20px',
        color: '#e6edf6'
      }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '20px',
            background: 'linear-gradient(45deg, #ffd93d, #d53369)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            Choose Your Plan
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#b8c5d6',
            marginBottom: '30px',
            maxWidth: '600px',
            margin: '0 auto 30px',
            lineHeight: '1.6'
          }}>
            Unlock the full potential of Watchsy with our premium features. 
            From basic movie tracking to advanced AI recommendations.
          </p>
          
          {/* Billing Toggle */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '40px'
          }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: billingCycle === 'monthly' ? '#ffd93d' : 'transparent',
                color: billingCycle === 'monthly' ? '#000' : '#ffffff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: billingCycle === 'yearly' ? '#ffd93d' : 'transparent',
                color: billingCycle === 'yearly' ? '#000' : '#ffffff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              Yearly
              <span style={{
                marginLeft: '8px',
                fontSize: '0.8rem',
                background: '#d53369',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '30px',
          marginBottom: '60px'
        }}>
          {subscriptionPlans.map((plan) => {
            const currentPrice = plan.price[billingCycle];
            const savings = billingCycle === 'yearly' && plan.price.monthly > 0 
              ? getSavings(plan.price.monthly, plan.price.yearly) 
              : null;

            return (
              <div
                key={plan.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(35, 43, 59, 0.8) 0%, rgba(24, 28, 36, 0.8) 100%)',
                  borderRadius: '20px',
                  padding: '40px 30px',
                  border: plan.popular ? '2px solid #ffd93d' : '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: plan.popular 
                    ? '0 20px 40px rgba(255, 217, 61, 0.2)' 
                    : '0 10px 30px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!plan.popular) {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!plan.popular) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
                  }
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-15px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(45deg, #ffd93d, #ffb347)',
                    color: '#000',
                    padding: '8px 20px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Most Popular
                  </div>
                )}

                {/* Plan Header */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <h3 style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    color: plan.color,
                    fontFamily: "'Montserrat', sans-serif"
                  }}>
                    {plan.name}
                  </h3>
                  <p style={{
                    color: '#b8c5d6',
                    marginBottom: '20px',
                    fontSize: '1rem'
                  }}>
                    {plan.description}
                  </p>
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '3rem',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      fontFamily: "'Montserrat', sans-serif"
                    }}>
                      {formatPrice(currentPrice)}
                    </span>
                    {currentPrice > 0 && (
                      <span style={{
                        fontSize: '1rem',
                        color: '#b8c5d6',
                        marginLeft: '5px'
                      }}>
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>
                  {savings && (
                    <div style={{
                      color: '#22c55e',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      Save ${savings.savings.toFixed(2)} ({savings.percentage}% off)
                    </div>
                  )}
                </div>

                {/* Features */}
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '15px',
                    color: '#ffffff',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    What's included:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {plan.features.map((feature, index) => (
                      <li key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px',
                        fontSize: '0.95rem',
                        color: '#e6edf6'
                      }}>
                        <span style={{
                          color: '#22c55e',
                          marginRight: '10px',
                          fontSize: '1.1rem'
                        }}>
                          ✓
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subscribe Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: plan.id === 'free' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : `linear-gradient(45deg, ${plan.color}, ${plan.color}dd)`,
                    color: plan.id === 'free' ? '#ffffff' : '#000000',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: plan.id === 'free' 
                      ? 'none' 
                      : `0 8px 20px ${plan.color}40`
                  }}
                  onMouseEnter={(e) => {
                    if (plan.id !== 'free') {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = `0 12px 25px ${plan.color}60`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (plan.id !== 'free') {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = `0 8px 20px ${plan.color}40`;
                    }
                  }}
                >
                  {plan.id === 'free' ? 'Get Started Free' : `Subscribe to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '40px',
            background: 'linear-gradient(45deg, #ffd93d, #d53369)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            Frequently Asked Questions
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '30px'
          }}>
            {[
  {
    question: "Can I change my plan anytime?",
    answer: "Yes! You can upgrade or downgrade instantly. Watchlists, likes, and data remain safe."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We support all major credit cards, PayPal, and Apple Pay. Easy and secure."
  },
  {
    question: "Is there a trial?",
    answer: "Yes! Pro & Premium both come with a 7-day free trial. No card required to start."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. Cancel from your account settings and keep access until the end of your billing cycle."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data (watchlists, likes, preferences) stays safe. You can export anytime, and we keep it for 30 days."
  },
  {
    question: "Do you offer student discounts?",
    answer: "Yes! Students get 50% off all plans. Just verify with your student email."
  }
]
.map((faq, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '25px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  marginBottom: '15px',
                  color: '#ffd93d',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {faq.question}
                </h3>
                <p style={{
                  color: '#b8c5d6',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(255, 217, 61, 0.1) 0%, rgba(213, 51, 105, 0.1) 100%)',
          borderRadius: '20px',
          padding: '50px 30px',
          border: '1px solid rgba(255, 217, 61, 0.2)'
        }}>
          <h2 style={{
            fontSize: '2.2rem',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#ffffff',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            Ready to enhance your movie experience?
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: '#b8c5d6',
            marginBottom: '30px',
            maxWidth: '600px',
            margin: '0 auto 30px',
            lineHeight: '1.6'
          }}>
            Join thousands of movie lovers who have already upgraded their Watchsy experience. 
            Start your free trial today!
          </p>
          <button
            onClick={() => handleSubscribe('pro')}
            style={{
              padding: '18px 40px',
              borderRadius: '15px',
              border: 'none',
              background: 'linear-gradient(45deg, #ffd93d, #d53369)',
              color: '#000000',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: "'Inter', sans-serif",
              boxShadow: '0 10px 25px rgba(255, 217, 61, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 15px 35px rgba(255, 217, 61, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 25px rgba(255, 217, 61, 0.3)';
            }}
          >
            Start Free Trial
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}