import { motion } from "framer-motion";
import { 
  Truck, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  FileText, 
  MapPin, 
  Camera, 
  Shield, 
  Zap, 
  Database, 
  Lock, 
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Mail,
  FileCheck
} from "lucide-react";
import { useEffect, useState } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 }
};

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function Showcase() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-transparent"></div>
        <motion.div 
          className="container mx-auto px-4 py-24 md:py-32 relative z-10"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div 
            className="flex justify-center mb-8"
            variants={scaleIn}
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Truck className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent"
            variants={fadeInUp}
            data-testid="text-hero-headline"
          >
            OVM Pro: Professional Vehicle Transport Management
          </motion.h1>

          <motion.p 
            className="text-xl md:text-2xl text-center text-blue-100 max-w-3xl mx-auto mb-12"
            variants={fadeInUp}
            data-testid="text-hero-subheadline"
          >
            Streamline your fleet operations with enterprise-grade technology, offline capabilities, and professional documentation
          </motion.p>

          <motion.div 
            className="flex justify-center gap-6"
            variants={fadeInUp}
          >
            <button 
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              data-testid="button-get-started"
            >
              Get Started
            </button>
            <button 
              className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-lg font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
              data-testid="button-learn-more"
            >
              Learn More
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Key Features Grid */}
      <section className="py-20 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            data-testid="text-features-heading"
          >
            Powerful Features
          </motion.h2>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: MapPin,
                title: "Real-time Tracking",
                description: "Monitor collections and deliveries in real-time with GPS integration and live status updates",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: WifiOff,
                title: "Offline Capable",
                description: "Complete driver workflows without internet connection, automatic sync when connected",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: Smartphone,
                title: "PWA Technology",
                description: "Native app experience across all devices, install directly on mobile home screen",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: FileText,
                title: "Professional Documents",
                description: "Automated POC/POD generation matching your invoice templates with OVM branding",
                gradient: "from-orange-500 to-red-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:scale-105"
                variants={fadeInUp}
                data-testid={`card-feature-${index}`}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3" data-testid={`text-feature-title-${index}`}>
                  {feature.title}
                </h3>
                <p className="text-blue-100/80" data-testid={`text-feature-description-${index}`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Workflow Showcase */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            data-testid="text-workflow-heading"
          >
            Comprehensive Workflows
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Collection Process */}
            <motion.div
              className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-2xl p-8 border border-blue-500/30"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              data-testid="card-collection-workflow"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <CheckCircle2 className="text-green-400" />
                Collection Process
              </h3>
              <ul className="space-y-4">
                {[
                  "Initial vehicle inspection and documentation",
                  "Comprehensive damage assessment with outline marking",
                  "Multi-angle photo capture (7 standard angles)",
                  "Wheel and tyre condition photography",
                  "Interior condition documentation",
                  "Environmental tracking (weather, location)",
                  "Digital signature capture with timestamp"
                ].map((step, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    data-testid={`text-collection-step-${index}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <span className="text-blue-100">{step}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Delivery Process */}
            <motion.div
              className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-2xl p-8 border border-green-500/30"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              data-testid="card-delivery-workflow"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Truck className="text-green-400" />
                Delivery Process
              </h3>
              <ul className="space-y-4">
                {[
                  "Pre-delivery condition verification",
                  "Final damage assessment and documentation",
                  "Delivery confirmation photography",
                  "Customer acceptance and digital signature",
                  "Automated POD generation and email delivery"
                ].map((step, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    data-testid={`text-delivery-step-${index}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <span className="text-green-100">{step}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Document Generation */}
      <section className="py-20 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            data-testid="text-documents-heading"
          >
            Professional Documentation
          </motion.h2>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: FileText,
                title: "Professional Invoicing",
                description: "Branded invoices with OVM styling and comprehensive job details"
              },
              {
                icon: FileCheck,
                title: "POC/POD Documents",
                description: "Automated Proof of Collection and Delivery document generation"
              },
              {
                icon: Mail,
                title: "Email Delivery",
                description: "Automatic email delivery to customers with PDF attachments"
              },
              {
                icon: ImageIcon,
                title: "PDF Optimization",
                description: "Intelligent compression reducing file sizes by 70-75%"
              }
            ].map((doc, index) => (
              <motion.div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                variants={fadeInUp}
                data-testid={`card-document-${index}`}
              >
                <doc.icon className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2" data-testid={`text-document-title-${index}`}>
                  {doc.title}
                </h3>
                <p className="text-blue-100/80 text-sm" data-testid={`text-document-description-${index}`}>
                  {doc.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Performance & Capabilities */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            data-testid="text-performance-heading"
          >
            Performance & Scale
          </motion.h2>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { value: 3000, suffix: "+", label: "Jobs Handled", icon: Truck },
              { value: 50, suffix: "", label: "Photos per Job", icon: Camera },
              { value: 75, suffix: "%", label: "Storage Reduction", icon: Database },
              { value: 1, suffix: "s", label: "API Response Time", icon: Zap }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-2xl p-6 text-center border border-blue-500/30"
                variants={scaleIn}
                data-testid={`card-stat-${index}`}
              >
                <stat.icon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <div className="text-4xl font-bold mb-2 text-blue-300" data-testid={`text-stat-value-${index}`}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-blue-100/80" data-testid={`text-stat-label-${index}`}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-12 bg-gradient-to-r from-blue-900/40 to-green-900/40 rounded-2xl p-8 border border-blue-500/30"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            data-testid="card-mobile-first"
          >
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Smartphone className="text-green-400" />
              Mobile-First Responsive Design
            </h3>
            <p className="text-blue-100/80">
              Optimized for drivers on the go. Fast loading times, intuitive touch interfaces, 
              and seamless offline capabilities ensure your team stays productive anywhere, anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Enterprise Security */}
      <section className="py-20 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            data-testid="text-security-heading"
          >
            Enterprise Security
          </motion.h2>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: Lock,
                title: "JWT Authentication",
                description: "Industry-standard JWT tokens with bcrypt password hashing for maximum security"
              },
              {
                icon: Shield,
                title: "Role-Based Access",
                description: "Granular permissions with Admin and Driver roles to control data access"
              },
              {
                icon: Zap,
                title: "Rate Limiting",
                description: "Automatic protection against brute force and DDoS attacks"
              },
              {
                icon: FileCheck,
                title: "Security Headers",
                description: "CSP, HSTS, and other security headers to prevent XSS and injection attacks"
              },
              {
                icon: Clock,
                title: "Session Management",
                description: "Secure session handling with automatic token refresh and expiry"
              },
              {
                icon: Database,
                title: "Data Encryption",
                description: "End-to-end encryption for sensitive data and secure database storage"
              }
            ].map((security, index) => (
              <motion.div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/30 transition-all"
                variants={fadeInUp}
                data-testid={`card-security-${index}`}
              >
                <security.icon className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3" data-testid={`text-security-title-${index}`}>
                  {security.title}
                </h3>
                <p className="text-blue-100/80" data-testid={`text-security-description-${index}`}>
                  {security.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            data-testid="text-tech-stack-heading"
          >
            Modern Technology Stack
          </motion.h2>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { name: "React 18", description: "Latest React with TypeScript" },
              { name: "PostgreSQL", description: "Robust Drizzle ORM integration" },
              { name: "Express", description: "High-performance backend API" },
              { name: "Real-time Sync", description: "Automatic data synchronization" },
              { name: "PWA", description: "Progressive Web App support" },
              { name: "Tailwind CSS", description: "Modern utility-first styling" },
              { name: "Framer Motion", description: "Smooth animations" },
              { name: "IndexedDB", description: "Offline data persistence" }
            ].map((tech, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all"
                variants={fadeInUp}
                data-testid={`card-tech-${index}`}
              >
                <h4 className="font-semibold text-blue-300 mb-1" data-testid={`text-tech-name-${index}`}>
                  {tech.name}
                </h4>
                <p className="text-sm text-blue-100/70" data-testid={`text-tech-description-${index}`}>
                  {tech.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            data-testid="text-cta-heading"
          >
            Ready to Transform Your Fleet Management?
          </motion.h2>
          <motion.p 
            className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            data-testid="text-cta-description"
          >
            Join forward-thinking transport companies using OVM Pro to streamline operations, 
            reduce costs, and deliver exceptional customer service.
          </motion.p>
          <motion.button 
            className="px-12 py-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-semibold text-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-2xl hover:shadow-blue-500/50 hover:scale-105"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-testid="button-cta-primary"
          >
            Schedule a Demo
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-4 text-center text-blue-100/60">
          <p data-testid="text-footer">
            © 2025 OVM Pro. Professional Vehicle Transport Management System.
          </p>
        </div>
      </footer>
    </div>
  );
}
