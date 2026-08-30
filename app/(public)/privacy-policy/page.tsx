import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <Link href="/join-beta" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Back to Join Beta
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-mono uppercase mb-6 rounded-full border border-blue-100">
          <ShieldCheck size={14} /> Legal & Privacy
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-6">
          Privacy Policy
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed">
          KAIZEN respects your digital privacy. Our data practices are governed strictly in accordance with the <strong>Digital Personal Data Protection Act, 2023</strong> of the Republic of India.
        </p>
      </div>

      {/* Document Content */}
      <article className="max-w-3xl mx-auto px-6 pb-32 prose prose-slate prose-headings:font-display prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:text-blue-700">
        
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 mb-12">
          <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">Official Gazetted Act Reference</h2>
          <p className="text-xs font-mono text-slate-400 mb-6">
            MINISTRY OF LAW AND JUSTICE (Legislative Department)<br />
            New Delhi, the 11th August, 2023/Sravana 20, 1945 (Saka)<br />
            REGISTERED NO. DL—(N)04/0007/2003—23
          </p>
          <hr className="border-slate-200 my-6" />
          
          <h3 className="font-serif text-2xl font-bold mb-4">THE DIGITAL PERSONAL DATA PROTECTION ACT, 2023</h3>
          <p className="font-serif text-lg italic text-slate-600 mb-6">(NO. 22 OF 2023)</p>
          <p className="font-serif leading-relaxed text-slate-700">
            An Act to provide for the processing of digital personal data in a manner that recognises both the right of individuals to protect their personal data and the need to process such personal data for lawful purposes and for matters connected therewith or incidental thereto.
          </p>
        </div>

        <h2>CHAPTER I: PRELIMINARY</h2>
        
        <h3>1. Short title and commencement</h3>
        <p>
          (1) This Act may be called the Digital Personal Data Protection Act, 2023.<br/>
          (2) It shall come into force on such date as the Central Government may, by notification in the Official Gazette, appoint and different dates may be appointed for different provisions of this Act and any reference in any such provision to the commencement of this Act shall be construed as a reference to the coming into force of that provision.
        </p>

        <h3>2. Definitions</h3>
        <p>In this Act, unless the context otherwise requires,—</p>
        <ul>
          <li><strong>(b) "automated"</strong> means any digital process capable of operating automatically in response to instructions given or otherwise for the purpose of processing data;</li>
          <li><strong>(c) "Board"</strong> means the Data Protection Board of India established by the Central Government under section 18;</li>
          <li><strong>(g) "Consent Manager"</strong> means a person registered with the Board, who acts as a single point of contact to enable a Data Principal to give, manage, review and withdraw her consent through an accessible, transparent and interoperable platform;</li>
          <li><strong>(h) "data"</strong> means a representation of information, facts, concepts, opinions or instructions in a manner suitable for communication, interpretation or processing by human beings or by automated means;</li>
          <li><strong>(i) "Data Fiduciary"</strong> means any person who alone or in conjunction with other persons determines the purpose and means of processing of personal data;</li>
          <li><strong>(j) "Data Principal"</strong> means the individual to whom the personal data relates...</li>
          <li><strong>(t) "personal data"</strong> means any data about an individual who is identifiable by or in relation to such data;</li>
          <li><strong>(u) "personal data breach"</strong> means any unauthorised processing of personal data or accidental disclosure, acquisition, sharing, use, alteration, destruction or loss of access to personal data, that compromises the confidentiality, integrity or availability of personal data;</li>
        </ul>

        <h2>CHAPTER II: OBLIGATIONS OF DATA FIDUCIARY</h2>
        
        <h3>4. Grounds for processing personal data</h3>
        <p>
          (1) A person may process the personal data of a Data Principal only in accordance with the provisions of this Act and for a lawful purpose,—<br />
          (a) for which the Data Principal has given her consent; or<br />
          (b) for certain legitimate uses.
        </p>

        <h3>5. Notice</h3>
        <p>
          (1) Every request made to a Data Principal under section 6 for consent shall be accompanied or preceded by a notice given by the Data Fiduciary to the Data Principal, informing her,—<br />
          (i) the personal data and the purpose for which the same is proposed to be processed;<br />
          (ii) the manner in which she may exercise her rights under sub-section (4) of section 6 and section 13; and<br />
          (iii) the manner in which the Data Principal may make a complaint to the Board.
        </p>

        <h3>6. Consent</h3>
        <p>
          (1) The consent given by the Data Principal shall be free, specific, informed, unconditional and unambiguous with a clear affirmative action, and shall signify an agreement to the processing of her personal data for the specified purpose and be limited to such personal data as is necessary for such specified purpose.<br/>
          <br/>
          (4) Where consent given by the Data Principal is the basis of processing of personal data, such Data Principal shall have the right to withdraw her consent at any time, with the ease of doing so being comparable to the ease with which such consent was given.
        </p>

        <h3>8. General obligations of Data Fiduciary</h3>
        <p>
          (1) A Data Fiduciary shall, irrespective of any agreement to the contrary or failure of a Data Principal to carry out the duties provided under this Act, be responsible for complying with the provisions of this Act and the rules made thereunder in respect of any processing undertaken by it or on its behalf by a Data Processor.<br/>
          <br/>
          (4) A Data Fiduciary shall implement appropriate technical and organisational measures to ensure effective observance of the provisions of this Act and the rules made thereunder.<br/>
          <br/>
          (5) A Data Fiduciary shall protect personal data in its possession or under its control, including in respect of any processing undertaken by it or on its behalf by a Data Processor, by taking reasonable security safeguards to prevent personal data breach.<br/>
          <br/>
          (7) A Data Fiduciary shall, unless retention is necessary for compliance with any law for the time being in force,—<br/>
          (a) erase personal data, upon the Data Principal withdrawing her consent or as soon as it is reasonable to assume that the specified purpose is no longer being served, whichever is earlier.
        </p>

        <h2>CHAPTER III: RIGHTS AND DUTIES OF DATA PRINCIPAL</h2>

        <h3>11. Right to access information about personal data</h3>
        <p>
          (1) The Data Principal shall have the right to obtain from the Data Fiduciary to whom she has previously given consent, including consent as referred to in clause (a) of section 7, for processing of personal data, upon making to it a request in such manner as may be prescribed,—<br/>
          (a) a summary of personal data which is being processed by such Data Fiduciary and the processing activities undertaken by that Data Fiduciary with respect to such personal data.
        </p>

        <h3>12. Right to correction and erasure of personal data</h3>
        <p>
          (1) A Data Principal shall have the right to correction, completion, updating and erasure of her personal data for the processing of which she has previously given consent.
        </p>

        <h3>13. Right of grievance redressal</h3>
        <p>
          (1) A Data Principal shall have the right to have readily available means of grievance redressal provided by a Data Fiduciary or Consent Manager in respect of any act or omission of such Data Fiduciary or Consent Manager regarding the performance of its obligations in relation to the personal data of such Data Principal.
        </p>

        <hr className="my-12" />
        <p className="text-sm text-slate-500 text-center">
          For full legal provisions, penalties (up to ₹250 crores), exemptions, and establishment details of the Data Protection Board of India, please refer to the complete official gazette publication of the Act.
        </p>
      </article>

    </div>
  );
}
