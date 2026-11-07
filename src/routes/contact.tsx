import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, Send, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Trinity Drop Query",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please complete all required fields.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Dispatch Received", {
        description: `Thank you, ${formData.name}. Our concierge team will respond within 24 hours.`,
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "Trinity Drop Query",
        message: "",
      });
    }, 600);
  };

  return (
    <div className="bg-black text-white pb-24">
      {/* Header Banner */}
      <section className="border-b border-white/10 bg-zinc-950 py-16">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <span className="eyebrow border border-white/20 bg-white/5 px-3 py-1.5 text-white font-bold tracking-[0.2em]">
            CLIENT CONCIERGE
          </span>
          <h1 className="display-xl mt-4 text-4xl sm:text-6xl text-white">
            CONTACT DRIPCYCLE<span className="text-red-500">X</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-xl">
            Inquiries regarding the Trinity Drop, size consultations, order dispatches, or tracking.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left Column: Contact Details & Info */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="eyebrow text-zinc-400 font-bold">DIRECT COMMUNICATIONS</span>
              <h2 className="display-xl mt-1 text-2xl sm:text-3xl text-white">CLIENT SERVICES</h2>
              <p className="mt-2 text-xs text-zinc-400">
                Operating Monday through Saturday for pan-India client assistance.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 border border-white/10 bg-zinc-950 p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 bg-white/5 text-white">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Direct Contact Number
                  </h4>
                  <a href="tel:+918469711940" className="text-sm font-semibold hover:underline block mt-0.5 text-zinc-200">
                    +91 84697 11940
                  </a>
                  <p className="text-[11px] text-zinc-500 mt-1">Mon – Sat, 10 AM – 7 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-4 border border-white/10 bg-zinc-950 p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 bg-white/5 text-white">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Official Email
                  </h4>
                  <a href="mailto:Dripcyclex@gmail.com" className="text-sm font-semibold hover:underline block mt-0.5 text-zinc-200">
                    Dripcyclex@gmail.com
                  </a>
                  <p className="text-[11px] text-zinc-500 mt-1">Response window: within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4 border border-white/10 bg-zinc-950 p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 bg-white/5 text-white">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    100% Online Dedicated Brand
                  </h4>
                  <p className="text-sm text-zinc-200 mt-0.5">
                    Direct-To-Consumer Model
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    No physical store markups. Direct priority dispatch across India.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-white/15 bg-zinc-950 p-6 text-white">
              <h4 className="display-xl text-lg text-white">ONLINE ORDERS & DISPATCH</h4>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Orders are verified and packed in custom protective matte packaging. Need help tracking your order? Reach out directly via <strong className="text-white">Dripcyclex@gmail.com</strong> or call <strong className="text-white">+91 84697 11940</strong>.
              </p>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-zinc-950 border border-white/10 p-6 sm:p-10">
            <span className="eyebrow text-zinc-400 font-bold">SEND MESSAGE</span>
            <h2 className="display-xl mt-1 text-2xl sm:text-4xl text-white">CLIENT DISPATCH</h2>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="h-11 w-full border border-white/15 bg-black px-4 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul@example.com"
                    className="h-11 w-full border border-white/15 bg-black px-4 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 84697 11940"
                    className="h-11 w-full border border-white/15 bg-black px-4 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Subject Focus
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="h-11 w-full border border-white/15 bg-black px-4 text-sm text-white focus:border-white focus:outline-none"
                  >
                    <option value="Trinity Drop Query">Trinity Drop Inquiries</option>
                    <option value="Sizing Help">Fit & Sizing Consultation</option>
                    <option value="Order Tracking">Order & Tracking Status</option>
                    <option value="Returns & Exchanges">Returns & Exchanges</option>
                    <option value="Wholesale">Press & Brand Collaboration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                  Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can our concierge team assist you today?"
                  className="w-full border border-white/15 bg-black p-4 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 border border-white bg-white py-4 text-xs font-black uppercase tracking-[0.2em] text-black hover:bg-zinc-200 transition-colors"
              >
                {loading ? "Transmitting..." : "Send Message"} <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="mt-24 border-t border-white/10 pt-16">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="eyebrow text-zinc-400 font-bold">HELP & DIRECTIVES</span>
            <h2 className="display-xl mt-2 text-3xl sm:text-5xl text-white">FREQUENTLY ASKED QUESTIONS</h2>
          </div>

          <div className="max-w-3xl mx-auto border border-white/10 bg-zinc-950 p-6 sm:p-8">
            <Accordion type="single" collapsible className="w-full divide-y divide-white/10">
              <AccordionItem value="item-1" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-white hover:text-zinc-300 text-left">
                  Are there physical offline retail stores?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400 leading-relaxed pt-2">
                  No, DRIPCYCLEX operates strictly as a 100% online direct-to-consumer brand. By eliminating brick-and-mortar overhead and distributor markups, we invest exclusively into premium 280–420 GSM milled fabrics, custom hardware, and expedited express delivery across India.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-white hover:text-zinc-300 text-left">
                  How do DRIPCYCLEX fits compare to standard sizing?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400 leading-relaxed pt-2">
                  All DRIPCYCLEX garments are cut with intentional architectural volume and drop shoulders. If you prefer a bold modern streetwear silhouette, choose your regular size. If you desire a standard fitted profile, choose one size down.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-white hover:text-zinc-300 text-left">
                  Why does DRIPCYCLEX showcase only 3 products?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400 leading-relaxed pt-2">
                  We reject fast-fashion dilution. We focus all our pattern design, custom milling, and quality control on a 3-piece Trinity Drop (Oversized Cyber Tee, Signature Stealth Hoodie, and Tactical Matte Bomber). Each piece is built to be an enduring grail.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-white hover:text-zinc-300 text-left">
                  What is your return and exchange policy?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400 leading-relaxed pt-2">
                  We provide a straightforward 15-day return or exchange policy across India for unwashed, unworn garments with original tags intact. Doorstep pickup is completely free.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-white hover:text-zinc-300 text-left">
                  How long does shipping take across India?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400 leading-relaxed pt-2">
                  Complimentary express shipping applies to all orders over ₹1999. Deliveries take 2–4 business days for major metro centers and 4–6 business days for the rest of India.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
