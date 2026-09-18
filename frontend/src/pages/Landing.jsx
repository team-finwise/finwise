import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
  { number: '01', icon: '◎', title: 'See your whole money story', text: 'Bring income, bills, spending and savings together in one clear monthly picture.' },
  { number: '02', icon: '↗', title: 'Plan the life ahead', text: 'Turn a big goal into a realistic plan, with the next best step always in view.' },
  { number: '03', icon: '✦', title: 'Ask smarter questions', text: 'Use your personal AI guide to understand trade-offs before you make a move.' },
];

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-offer">A calmer way to grow your money <span>— your first plan is free</span></div>
      <header className="landing-nav">
        <Link to="/" className="landing-brand"><b>✦</b> fin<span>wise</span></Link>
        <nav><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#security">Privacy</a></nav>
        <div className="landing-nav-actions"><Link className="login-link" to="/login">Sign in</Link><Link className="landing-button small" to="/signup">Start free</Link></div>
      </header>

      <main>
        <section className="hero">
          <video className="hero-video" autoPlay muted loop playsInline poster="/favicon.svg"><source src="/media/finwise-hero.mp4" type="video/mp4" /></video>
          <div className="hero-shade" />
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: 'easeOut' }}>
            <p className="hero-kicker">PERSONAL FINANCE, MADE PERSONAL</p>
            <h1>Money clarity<br />for your real life.</h1>
            <p>Build better habits, track your progress, and make room for the future you want.</p>
            <div className="hero-actions"><Link className="landing-button" to="/signup">Build my money map <span>→</span></Link><a className="watch-link" href="#features"><i>▶</i> Explore Finwise</a></div>
          </motion.div>
          <motion.div className="hero-stat stat-one" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .6, delay: .55 }}><small>YOUR MONTH AT A GLANCE</small><strong>₹ 18,450</strong><span><b>↑ 12%</b> ready for your goals</span><div className="stat-bars"><i /><i /><i /><i /><i /></div></motion.div>
          <motion.div className="hero-goal" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .85 }}><span>YOUR NEXT MILESTONE</span><strong>Goa, 2027</strong><div><i /></div><small>64% of the way there</small></motion.div>
        </section>

        <section id="features" className="feature-section">
          <div className="section-heading"><p>BUILT FOR EVERYDAY DECISIONS</p><h2>Less spreadsheet.<br /><em>More possibility.</em></h2><span>Finwise makes the important parts of your financial life easy to see, understand, and act on.</span></div>
          <div className="feature-grid">
            {features.map((feature, index) => <motion.article key={feature.number} className="feature-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .55, delay: index * .12 }}><div><b>{feature.number}</b><i>{feature.icon}</i></div><h3>{feature.title}</h3><p>{feature.text}</p><span>Discover more <b>→</b></span></motion.article>)}
          </div>
        </section>

        <section id="how-it-works" className="steps-section"><div><p>YOUR FIRST 5 MINUTES</p><h2>A plan that starts<br />with <em>you.</em></h2></div><ol><li><b>1</b><span>Tell us what matters</span><p>Add your income, essentials, and the goal that is calling you forward.</p></li><li><b>2</b><span>Find your clear path</span><p>See your money pattern and the choices that make the biggest difference.</p></li><li><b>3</b><span>Move with confidence</span><p>Check in as life changes and keep your next move beautifully simple.</p></li></ol></section>

        <section id="security" className="security-section"><div className="security-orbit" /><p>PRIVATE BY DESIGN</p><h2>Your plan is yours.</h2><span>Your data is protected and your financial profile stays personal. No noise, no pressure — just a better view.</span><Link className="landing-button light" to="/signup">Start with Finwise <b>→</b></Link></section>
      </main>
      <footer className="landing-footer"><span>© 2026 Finwise</span><span>Made for meaningful progress.</span><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></footer>
    </div>
  );
}
