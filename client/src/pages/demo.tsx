import { motion } from "framer-motion";
import { 
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  HelpCircle,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Shield,
  Smartphone,
  TrendingUp,
  Truck,
  Users,
  X,
  Zap,
  Bell,
  Image as ImageIcon,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

export default function Demo() {
  return (
    <div className="min-h-screen bg-white">
      {/* 1. OPENING HOOK */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <motion.div 
          className="container mx-auto px-4 py-24 md:py-32 relative z-10"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            variants={fadeInUp}
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-8"
              variants={scaleIn}
            >
              <Truck className="w-5 h-5" />
              <span className="text-sm font-medium">Professional Vehicle Transport</span>
            </motion.div>

            <h1 
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
              data-testid="text-main-headline"
            >
              The Modern Way to Move Vehicles
            </h1>

            <p 
              className="text-2xl md:text-3xl text-blue-100 mb-12 leading-relaxed"
              data-testid="text-main-subheadline"
            >
              No more communication blackouts. No more surprises.<br />
              Just professional, transparent transport.
            </p>

            <motion.div 
              className="flex flex-wrap justify-center gap-4"
              variants={fadeInUp}
            >
              <Button 
                size="lg"
                className="px-8 py-6 bg-white text-blue-700 hover:bg-blue-50 text-lg font-semibold shadow-xl"
                data-testid="button-cta-primary"
              >
                Let's Talk About Your Needs
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. THE PROBLEM */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" data-testid="text-problem-heading">
              Sound Familiar?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The frustrations of working with traditional transport companies
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: HelpCircle,
                title: "\"Where's my vehicle?\"",
                description: "No real-time tracking. You're left calling drivers for updates that may or may not come.",
                color: "red"
              },
              {
                icon: Camera,
                title: "\"What condition is it in?\"",
                description: "No photo documentation at collection or delivery. Disputes arise with no proof.",
                color: "red"
              },
              {
                icon: AlertCircle,
                title: "\"Did it arrive?\"",
                description: "Unclear delivery status. You have to chase for confirmation every single time.",
                color: "red"
              },
              {
                icon: MessageSquare,
                title: "Communication Blackouts",
                description: "Drivers don't respond. Messages go unanswered. You're kept in the dark.",
                color: "red"
              },
              {
                icon: FileText,
                title: "Paper-Based PODs",
                description: "Waiting days for scanned paperwork. Lost documents. Manual filing nightmares.",
                color: "red"
              },
              {
                icon: X,
                title: "Condition Disputes",
                description: "\"That damage wasn't there!\" Without proof, you're stuck mediating arguments.",
                color: "red"
              }
            ].map((problem, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl p-6 border-2 border-red-100 hover:border-red-200 transition-all"
                variants={fadeInUp}
                data-testid={`card-problem-${index}`}
              >
                <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                  <problem.icon className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3" data-testid={`text-problem-title-${index}`}>
                  {problem.title}
                </h3>
                <p className="text-gray-600 leading-relaxed" data-testid={`text-problem-description-${index}`}>
                  {problem.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-2xl font-semibold text-gray-900">
              Your customers deserve better. <span className="text-blue-600">So do you.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3. THE OVM DIFFERENCE - USP SECTION */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" data-testid="text-difference-heading">
              How OVM Does Things Differently
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We built our system around what you actually need: visibility, accountability, and professionalism
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: MapPin,
                title: "Full Transparency",
                description: "Real-time GPS tracking on every job. Know exactly where every vehicle is, every moment of the journey.",
                benefit: "No more \"Where is it?\" calls"
              },
              {
                icon: Camera,
                title: "Digital Documentation",
                description: "Professional POC and POD with comprehensive photos before and after transport. Everything timestamped and stored.",
                benefit: "Complete proof, zero disputes"
              },
              {
                icon: Bell,
                title: "Instant Communication",
                description: "Automated updates throughout the journey. Collection confirmed, in transit, delivered - you know it all.",
                benefit: "Updates come to you automatically"
              },
              {
                icon: Shield,
                title: "Condition Accountability",
                description: "Complete photo documentation of every angle, every panel. Damage reports with visual proof.",
                benefit: "Protect yourself from disputes"
              },
              {
                icon: Smartphone,
                title: "Modern Technology",
                description: "Everything digital, accessible from any device, anytime. No more waiting for paperwork.",
                benefit: "Access everything instantly"
              },
              {
                icon: CheckCircle2,
                title: "Professional Standards",
                description: "Every job follows the same rigorous process. Consistent quality, every single time.",
                benefit: "Reliability you can count on"
              }
            ].map((difference, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border-2 border-blue-100 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
                variants={fadeInUp}
                data-testid={`card-difference-${index}`}
              >
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <difference.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3" data-testid={`text-difference-title-${index}`}>
                  {difference.title}
                </h3>
                <p className="text-gray-700 mb-4 leading-relaxed" data-testid={`text-difference-description-${index}`}>
                  {difference.description}
                </p>
                <div className="flex items-start gap-2 text-sm font-semibold text-blue-700">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{difference.benefit}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. WHAT WORKING WITH OVM LOOKS LIKE */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" data-testid="text-experience-heading">
              What Working With OVM Looks Like
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From booking to delivery, here's the experience your customers will receive
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Booking",
                subtitle: "Quick, Professional Quote & Scheduling",
                description: "Simple online booking or call us directly. Clear pricing, confirmed pickup times. No hidden fees, no surprises.",
                icon: FileCheck,
                details: [
                  "Instant quote via phone or online",
                  "Transparent pricing breakdown",
                  "Flexible scheduling to suit your needs",
                  "Booking confirmation sent immediately"
                ]
              },
              {
                step: "2",
                title: "Collection Day",
                subtitle: "Driver Arrives With Tablet, Takes Photos, Digital Paperwork",
                description: "Professional driver with tablet arrives on time. Complete vehicle inspection with photos of every angle. Digital POC signed on the spot.",
                icon: Camera,
                details: [
                  "Driver arrives with professional equipment",
                  "Comprehensive photo documentation (front, rear, sides, roof, interior)",
                  "Digital condition report with damage mapping",
                  "POC signed digitally - copy emailed instantly"
                ]
              },
              {
                step: "3",
                title: "In Transit",
                subtitle: "GPS Tracking, Real-Time Updates",
                description: "Track the vehicle's journey in real-time. Automated updates as status changes. Know exactly where it is, always.",
                icon: MapPin,
                details: [
                  "Live GPS tracking throughout journey",
                  "Automatic status updates (collected, in transit, nearby)",
                  "Estimated delivery time updates",
                  "Direct driver contact if needed"
                ]
              },
              {
                step: "4",
                title: "Delivery",
                subtitle: "More Photos, Digital Signature, Instant POD",
                description: "Same professional process at delivery. Photos confirm condition. Digital signature captured. POD created instantly.",
                icon: Package,
                details: [
                  "Comprehensive delivery photos taken",
                  "Condition compared to collection photos",
                  "Digital signature from recipient",
                  "POD generated and emailed immediately"
                ]
              },
              {
                step: "5",
                title: "Post-Delivery",
                subtitle: "All Documentation Emailed Immediately",
                description: "Complete digital package sent to your inbox within minutes. Photos, signatures, condition reports - everything you need.",
                icon: Mail,
                details: [
                  "POC and POD emailed to you",
                  "All photos included and timestamped",
                  "Digital records stored securely",
                  "Access anytime from any device"
                ]
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="mb-12 last:mb-0"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                data-testid={`experience-step-${index}`}
              >
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {step.step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className="w-6 h-6 text-blue-600" />
                      <h3 className="text-2xl font-bold text-gray-900" data-testid={`text-experience-title-${index}`}>
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-lg font-semibold text-blue-600 mb-3">
                      {step.subtitle}
                    </p>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {step.description}
                    </p>
                    <Card className="bg-white border-blue-100 p-4">
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. REAL EXAMPLES - SHOW DON'T TELL */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-examples-heading">
              What You'll Actually Receive From Us
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Real documentation, real transparency, real accountability
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: ImageIcon,
                title: "Professional POC (Proof of Collection)",
                description: "Complete photo documentation at collection with:",
                items: [
                  "Front, rear, both sides, roof, and interior photos",
                  "Close-ups of any existing damage",
                  "Interactive damage diagram showing exact locations",
                  "Odometer reading and fuel level",
                  "Digital signature from vehicle owner",
                  "Timestamped and GPS-tagged"
                ]
              },
              {
                icon: FileCheck,
                title: "Professional POD (Proof of Delivery)",
                description: "Same comprehensive documentation at delivery:",
                items: [
                  "All same angles photographed again",
                  "Condition comparison to collection photos",
                  "Any new damage clearly highlighted",
                  "Updated odometer and fuel level",
                  "Digital signature from recipient",
                  "Instant email delivery to all parties"
                ]
              },
              {
                icon: Mail,
                title: "Email Notifications Throughout",
                description: "Automated updates keep everyone informed:",
                items: [
                  "\"Collection confirmed\" with POC attached",
                  "\"Vehicle in transit\" with tracking link",
                  "\"Approaching delivery location\" alert",
                  "\"Delivered successfully\" with POD attached",
                  "All accessible in your email archive"
                ]
              },
              {
                icon: MapPin,
                title: "Live Tracking Dashboard",
                description: "Real-time visibility for you and your customers:",
                items: [
                  "GPS location updated in real-time",
                  "Journey progress displayed visually",
                  "Estimated delivery time",
                  "Driver contact information",
                  "Complete job history accessible anytime"
                ]
              }
            ].map((example, index) => (
              <motion.div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                variants={fadeInUp}
                data-testid={`card-example-${index}`}
              >
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <example.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3" data-testid={`text-example-title-${index}`}>
                  {example.title}
                </h3>
                <p className="text-blue-100 mb-4">
                  {example.description}
                </p>
                <ul className="space-y-2">
                  {example.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-sm text-blue-50">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 6. WHY ADD OR SWITCH TO OVM */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" data-testid="text-switch-heading">
              Why Add or Switch to OVM
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're looking for a backup option or ready to make a complete change
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* For businesses with existing providers */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border-2 border-blue-200"
              data-testid="card-add-provider"
            >
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                For Businesses With Existing Providers
              </h3>
              <ul className="space-y-4">
                {[
                  {
                    title: "Add us as a backup/overflow option",
                    description: "Don't rely on one provider. Have us ready when you need extra capacity."
                  },
                  {
                    title: "Compare our service quality",
                    description: "Give us a trial job. See the difference professional standards make."
                  },
                  {
                    title: "Reduce dependency on single provider",
                    description: "Protect your business from provider failures or capacity issues."
                  },
                  {
                    title: "Better rates, better service",
                    description: "Competitive pricing with superior documentation and communication."
                  }
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* For businesses looking to switch */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border-2 border-green-200"
              data-testid="card-switch-provider"
            >
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                For Businesses Looking to Switch
              </h3>
              <ul className="space-y-4">
                {[
                  {
                    title: "Eliminate communication headaches",
                    description: "No more chasing drivers. Updates come to you automatically."
                  },
                  {
                    title: "Protect yourself with documentation",
                    description: "Complete photo evidence eliminates disputes and liability concerns."
                  },
                  {
                    title: "Impress your customers with transparency",
                    description: "Show them real-time tracking and professional documentation."
                  },
                  {
                    title: "Save time chasing updates",
                    description: "Get back hours every week. Know exactly what's happening without asking."
                  }
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. THE BUSINESS CASE */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" data-testid="text-business-case-heading">
              How OVM Saves You Time & Money
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The real ROI of professional transport services
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: TrendingUp,
                title: "Fewer Customer Complaints",
                metric: "80% reduction",
                description: "Customers love visibility. Real-time tracking and instant PODs mean happy customers who don't need to call you."
              },
              {
                icon: Shield,
                title: "No Disputes About Vehicle Condition",
                metric: "Zero disputes",
                description: "Comprehensive photo documentation eliminates \"he said, she said\" arguments. Protect your business and reputation."
              },
              {
                icon: Clock,
                title: "Time Saved Not Chasing Drivers",
                metric: "5+ hours/week",
                description: "Stop calling drivers for updates. Automated notifications and tracking give you time back for actual business."
              },
              {
                icon: Users,
                title: "Better Customer Satisfaction",
                metric: "95% satisfaction",
                description: "Professional service impresses customers. They'll notice the difference and keep coming back."
              },
              {
                icon: CheckCircle2,
                title: "Professional Image",
                metric: "Competitive advantage",
                description: "Stand out from competitors. Show customers you use modern, professional partners."
              },
              {
                icon: FileCheck,
                title: "Reduced Administrative Burden",
                metric: "Digital-first",
                description: "No more filing paper PODs. Everything digital, searchable, and accessible from anywhere."
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
                variants={fadeInUp}
                data-testid={`card-business-benefit-${index}`}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                  {benefit.metric}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3" data-testid={`text-business-benefit-title-${index}`}>
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed" data-testid={`text-business-benefit-description-${index}`}>
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 8. OUR COMMITMENT */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" data-testid="text-commitment-heading">
              Our Commitment to You
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The standards you can expect, every single time
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: Clock,
                title: "Response Times",
                commitments: [
                  "Quotes within 2 hours during business hours",
                  "Phone calls answered or returned within 1 hour",
                  "Email inquiries responded to same day",
                  "Emergency support available 24/7"
                ]
              },
              {
                icon: Shield,
                title: "Service Standards",
                commitments: [
                  "Every vehicle photographed comprehensively",
                  "Digital POC and POD on every job",
                  "Professional, uniformed drivers",
                  "Fully insured and licensed transport"
                ]
              },
              {
                icon: Phone,
                title: "Support Availability",
                commitments: [
                  "Phone support 7am-8pm, 7 days a week",
                  "Live tracking accessible 24/7",
                  "Dedicated account manager for regular clients",
                  "Immediate escalation path for urgent issues"
                ]
              },
              {
                icon: FileText,
                title: "Pricing Transparency",
                commitments: [
                  "Clear, upfront pricing - no hidden fees",
                  "Written quotes for every job",
                  "Volume discounts for regular business",
                  "No surprise charges, ever"
                ]
              }
            ].map((commitment, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-200"
                variants={fadeInUp}
                data-testid={`card-commitment-${index}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <commitment.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900" data-testid={`text-commitment-title-${index}`}>
                    {commitment.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {commitment.commitments.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 9. SIMPLE NEXT STEPS */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-next-steps-heading">
              Let's Start With a Trial Job
            </h2>
            <p className="text-2xl text-blue-100 mb-8">
              We'll prove the difference. No long-term commitment required.
            </p>
            <p className="text-xl text-blue-50 mb-12 leading-relaxed">
              Give us one job. See the professional documentation, the real-time tracking, 
              the instant POD. If we don't exceed your expectations, you owe us nothing but the transport fee.
            </p>

            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12"
              variants={scaleIn}
            >
              <h3 className="text-2xl font-bold mb-6">Get Started Today</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-left">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-100">Call Us Now</p>
                      <a 
                        href="tel:0800123456" 
                        className="text-2xl font-bold hover:underline"
                        data-testid="link-phone-footer"
                      >
                        0800 123 456
                      </a>
                    </div>
                  </div>
                  <p className="text-sm text-blue-50 ml-16">
                    Speak to our team directly about your transport needs
                  </p>
                </div>

                <div className="text-left">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-100">Email Us</p>
                      <a 
                        href="mailto:transport@ovm.co.uk" 
                        className="text-xl font-bold hover:underline break-all"
                        data-testid="link-email-footer"
                      >
                        transport@ovm.co.uk
                      </a>
                    </div>
                  </div>
                  <p className="text-sm text-blue-50 ml-16">
                    Get a quote response within 2 hours during business hours
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/20">
                <p className="text-lg font-semibold mb-2">Available 7 Days a Week</p>
                <p className="text-blue-100">Monday - Friday: 7am - 8pm | Saturday - Sunday: 9am - 6pm</p>
              </div>
            </motion.div>

            <Button 
              size="lg"
              className="px-12 py-6 bg-white text-blue-700 hover:bg-blue-50 text-xl font-bold shadow-2xl hover:scale-105 transition-transform"
              data-testid="button-final-cta"
            >
              Schedule a Trial Transport
            </Button>

            <p className="mt-8 text-blue-100 text-lg">
              Join the dealerships and auction houses who've already made the switch to professional, transparent transport.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-semibold">OVM Vehicle Transport</span>
            </div>
            <p className="text-gray-400 text-center">
              Professional vehicle transport services across the UK
            </p>
            <p className="text-gray-400">
              © {new Date().getFullYear()} OVM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
