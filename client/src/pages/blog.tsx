import { Helmet } from "react-helmet-async";

export default function Blog() {
  return (
    <>
      <Helmet>
        <title>Blog - Business Outreach Tips & Strategies | DMgine Business</title>
        <meta 
          name="description" 
          content="Learn proven strategies for writing effective business outreach messages, social media communication, and professional messaging that gets responses from clients and partners." 
        />
      </Helmet>
      
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Blog Header */}
          <header className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
              DMgine Business Blog
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Master professional business outreach with proven strategies, real examples, and actionable tips for small business owners.
            </p>
          </header>

          {/* Blog Posts */}
          <div className="space-y-16">
            
            {/* Post 1: How to Write Cold DMs That Actually Work */}
            <article className="max-w-2xl mx-auto">
              <header className="mb-8">
                <h2 className="text-3xl font-bold text-black dark:text-white mb-4">
                  How to Write Business Outreach Messages That Actually Work
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Most business outreach messages fail because they sound like mass-produced spam. The secret to success lies in three fundamental principles: personalization, brevity, and clear business value.
                </p>
              </header>
              
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">Why Most Business Messages Fail</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  The average business owner receives dozens of generic outreach messages daily. Your message needs to stand out by being genuinely relevant to their business needs. This means researching their brand and current challenges before reaching out.
                </p>

                <h3 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">The Three Pillars of Effective Business Outreach</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">1. Business-Relevant Personalization</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      Don't just mention their business name. Reference recent product launches, social media posts, or industry achievements. Show you've invested time in understanding their brand and current business goals.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">2. Respect Their Time</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      Keep your message under 100 words. Busy business owners scan messages quickly. If you can't explain your business value in a few sentences, you haven't clarified your offering.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">3. Clear Business Intent</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      State exactly what collaboration you're proposing and why it benefits their business. Vague partnership requests get ignored. Specific opportunities with clear mutual benefits get responses.
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">Good Business Message vs Bad Business Message Example</h3>
                
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-6">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">❌ Bad Business Message</h4>
                  <p className="text-red-700 dark:text-red-300 italic">
                    "Hi! I help businesses grow their revenue through innovative marketing solutions. We've helped 500+ companies achieve 3x growth. Would love to chat about how we can help your business succeed too!"
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">✅ Good Business Message</h4>
                  <p className="text-green-700 dark:text-green-300 italic">
                    "Hi Sarah, loved your Instagram story about launching your new sustainable jewelry line! I run a small marketing agency that specializes in eco-friendly brands. We helped GreenStyle Boutique increase their social media engagement by 150% last quarter. Would you be interested in a quick 15-minute chat about potential collaboration opportunities for your brand launch?"
                  </p>
                </div>
              </div>
            </article>

            {/* Post 2: Why Your LinkedIn Outreach Sucks */}
            <article className="max-w-2xl mx-auto">
              <header className="mb-8">
                <h2 className="text-3xl font-bold text-black dark:text-white mb-4">
                  Why Your LinkedIn Outreach Sucks (And How to Fix It)
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  LinkedIn has become a wasteland of cringe-worthy sales pitches and cookie-cutter templates. Here's why your outreach isn't working and three quick fixes that will transform your response rates.
                </p>
              </header>
              
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">The Deadly Sins of LinkedIn Outreach</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">Cringe Intros That Kill Conversations</h4>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      "I hope this message finds you well..." Stop. Everyone knows you hope nothing about them. You're a stranger with an agenda.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      Instead, lead with something specific about them or their company. Make it clear you're not copy-pasting.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">Generic Value Props</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      "We help companies save time and money" means nothing. Every service provider claims this. Your value proposition should be so specific that only your ideal customer would find it relevant.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">Overused Templates</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      If your message could work for any company in any industry, it's too generic. Templates are tools, not crutches. Use them as starting points, not final products.
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">3 Quick Fixes That Work</h3>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">1. The Research Hook</h4>
                    <p className="text-blue-700 dark:text-blue-300">
                      Spend 2 minutes researching before sending. Mention a recent post, company news, or mutual connection. This single step will 3x your response rate.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">2. The Specific Ask</h4>
                    <p className="text-blue-700 dark:text-blue-300">
                      Replace "I'd love to chat" with "Would you be open to a 15-minute call Thursday to discuss X specific thing?" Vague requests get vague responses (or none).
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">3. The Value-First Approach</h4>
                    <p className="text-blue-700 dark:text-blue-300">
                      Lead with something useful: an insight, resource, or introduction. Give before you ask. This builds goodwill and positions you as someone worth knowing.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Post 3: What Makes a Great DM Opener */}
            <article className="max-w-2xl mx-auto">
              <header className="mb-8">
                <h2 className="text-3xl font-bold text-black dark:text-white mb-4">
                  What Makes a Great DM Opener?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Your first line determines whether someone reads your message or deletes it. Understanding the psychology behind effective openers will transform your outreach game.
                </p>
              </header>
              
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">The Psychology of First Impressions</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  People decide whether to engage with your message within seconds. Your opener needs to trigger one of three psychological responses: curiosity, recognition, or relevance.
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">Curiosity</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      Create an information gap that compels them to read more. Hint at value without revealing everything upfront.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">Recognition</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      Reference mutual connections, shared experiences, or their content. Familiarity breeds trust and increases response rates.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">Relevance</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      Show you understand their world and challenges. Make it immediately clear why this message matters to them specifically.
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">5 Proven Opener Examples</h3>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4">
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">1. The Funny Approach</h4>
                    <p className="text-gray-700 dark:text-gray-300 italic mb-2">
                      "I promise this isn't another 'I hope this email finds you well' message..."
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Works because it acknowledges the spam problem with humor while positioning you as different.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4">
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">2. The Direct Hook</h4>
                    <p className="text-gray-700 dark:text-gray-300 italic mb-2">
                      "Quick question about your Q4 expansion plans..."
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Gets straight to business while showing you understand their current priorities.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4">
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">3. The Mutual Connection</h4>
                    <p className="text-gray-700 dark:text-gray-300 italic mb-2">
                      "John Smith mentioned you're the go-to person for..."
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Leverages social proof and warm introductions to build immediate credibility.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4">
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">4. The Content Reference</h4>
                    <p className="text-gray-700 dark:text-gray-300 italic mb-2">
                      "Loved your post about scaling customer success teams..."
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Shows you're actually following their content and share common interests.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4">
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">5. The Value Bomb</h4>
                    <p className="text-gray-700 dark:text-gray-300 italic mb-2">
                      "Found a potential security vulnerability on your checkout page..."
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Leads with immediate value. They have to respond because ignoring could cost them.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-8">
                  <h4 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">💡 Pro Tip</h4>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Test different opener styles with different audiences. B2B executives respond well to direct approaches, while creatives prefer more personality. Match your style to your audience.
                  </p>
                </div>
              </div>
            </article>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16 p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-4">
              Ready to Write Better DMs?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Use DMgine's AI-powered generator to create personalized messages that follow these proven strategies.
            </p>
            <a 
              href="/" 
              className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Try DMgine Now
            </a>
          </div>
        </div>
      </div>
    </>
  );
}