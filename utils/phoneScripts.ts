/**
 * Phone Call Scripts for Agnes-21
 * Scripts for various customer scenarios
 */

export interface PhoneScript {
  id: string;
  title: string;
  category: 'estimate' | 'objection' | 'authorization' | 'pushback' | 'retail';
  content: string;
  description: string;
  voice?: 'agnes_21' | '21' | 'reeses_piecies'; // Optional voice selection for TTS
}

export const PHONE_SCRIPTS: PhoneScript[] = [
  {
    id: 'full-approval-estimate',
    title: 'Full Approval Estimate Phone Call',
    category: 'estimate',
    description: 'Call to make when you receive a full approval estimate from insurance',
    content: `Full Approval Estimate Phone Call

This is the call you will make to your HO as soon as you receive the estimate

"Hello sir/ma'am! It's [YOUR NAME] with Roof ER. Congratulations, I am glad we were able to ensure that your insurance company fully approved your roof/siding/gutters/etc replacement!

"So the next steps are, as I mentioned last time we met:

"One of our Project Coordinators will be reaching out to you to schedule a Project Meeting to go over your full scope of work.

"Based on the estimate, your insurance company will be sending you [ACV AMOUNT] shortly. This will be used as your down payment. With that, we can start all of your work! When they send you that check, just hold on to it until your meeting with our Project Coordinator who will help with all the next steps.

"Our estimating team will also be sending in supplements to the insurance company based on items they may have missed. This includes Code Items such as IWS and Drip Edge. And don't worry! Even if for some reason they do not approve these amounts, we will still do all the necessary work and never charge you for it. As we talked about earlier, your only cost out of this will be your deductible once we finish all the work.

"Upon completion of the installation, we will review and inspect all of our work to ensure it is to your satisfaction. Then we will send in a completion form once you sign off on the complete project. That's when the insurance company will release the remaining funds minus your deductible. So your final payment will only be those funds plus your deductible.

"Any questions so far, sir/ma'am?"

Answer any questions

"Great! Again, I am glad that we were able to make this happen for you, now you get to experience the quality that Roof ER always delivers, at only the cost of your deductible after your whole project is complete!"

Potentially mention additional work that they may want to add.

Answer any additional questions or engage in any conversation the HO starts.

"Also, if you know anyone else that I can help, have them reach out to me! You have my card - they can call, text, or email me and I can inspect their property to see if they have the same qualifying damage and I can walk them through the same process I have walked you through!

Engage in any conversation that this starts

"Awesome!

If you haven't already put up a yard sign: "Would you mind if I put up a yard sign next time I'm in your area? This will definitely help other companies already know that you're working with someone and hopefully eliminate anyone else from knocking your door asking about your roof/siding."

"Look out for the communication from one of our Project Coordinators so you can get that Project Meeting scheduled to go over all the next steps and your full scope of work. Congratulations again and have a great day!"`
  },
  {
    id: 'partial-estimate-denial',
    title: 'Partial Estimate/Denial Phone Call',
    category: 'estimate',
    description: 'Call to make when you receive a partial approval or denial',
    content: `Partial Estimate/Denial Phone Call

This is the call you will make to your HO as soon as you receive the estimate

"Hello sir/ma'am! It's [YOUR NAME] with Roof ER. How's it going?"

"Great, well we just received the decision from the insurance company. We're going to have to take some steps to get this turned around. I have already submitted my photo report that demonstrates the damage to your property and the need to replace your whole roof, so hopefully they review and approve that. Could you please reach out to the adjuster to see if they were able to review my report?"

After HO answers. "Thank you! During that call, please let them know that you disagree with their current decision and would like to have your property reinspected if they are not able to update their current decision to a full approval based on the photo report that I sent them."

If there are some approved shingles:

"So we will also be conducting an iTel and Repair Attempt.

"An iTel is where we will take a shingle off your roof and send it in to get tested to verify that it is discontinued. Since it is discontinued, the only effective way to restore your property would be with a full roof replacement.

"At that time, I will also take a video of us removing and replacing that shingle. This Repair Attempt video will demonstrate to the insurance company that your roof is not repairable and therefore would need to be fully replaced.

"To get those scheduled, I will need you to sign these 2 documents allowing us to do that. When you see the documents, it will have a cost attached, but don't worry! Read the bold print and you will see that you, as the homeowner, are never responsible for this cost."

Schedule a time to meet with the HO to sign or let them know you will be sending it out for eSign. Task the proper people for eSign, if necessary.

"We will definitely be putting in the work to give you the highest chance of getting this turned around. I definitely believe your roof has the damage that warrants a full replacement. But, of course, insurance companies are billion dollar, publicly traded companies that will try to save as much money as they can on every claim. That is why it is great that you are working with us since we know the proper steps to ensure that you are adequately taken care of by your insurance company!"

Answer any questions or concerns the HO has.

"Alright, so let me know how the phone call goes with your adjuster and I'll start working on my end to put everything together to get this turned around. Thank you, sir/ma'am, goodbye!"`
  },
  {
    id: 'contingency-claim-auth',
    title: 'Contingency & Claim Authorization',
    category: 'authorization',
    description: 'Script for getting claim authorization after filing',
    content: `Contingency & Claim Authorization

After the claim: "Okay, perfect! Like they said, an adjuster will be reaching out to you in the next 24 to 48 hours to schedule the inspection. The absolute most important part of this process is that I am at this inspection. Insurance companies don't want to pay out. They are trying to mitigate their losses after storms. I am there as your representation to make sure you get a fair shake.

Turn the iPad so you and the homeowner can see.

"This basic/simple agreement backs you as the homeowner by guaranteeing you that your only cost will be your deductible if we get you fully approved. If it is a partial approval or denial, first we will fight and jump through the necessary hoops to turn that into a full approval; but if we are not able to get you fully approved, this contract is null and void and you do not owe us a penny."

"What's in it for us, is we just want to get to do the work. This agreement commits you to using us if we hold up our end of the bargain and achieve a full-approval."

You sign
They sign

"This next form is our Claim Authorization form. Very simple, it allows us to communicate with your insurance company. I'll be here for the inspection and we will also communicate with them through email and phone calls so you don't have to be a middle-man. Of course, I'll always keep you looped in with our communication by CCing you in all emails and updating you on any conversations we have.

They sign

Press Submit enter password "roofer" if it asks.

"Alright, we are all set! Again, the most important part of this process is that I am here when the insurance company comes out. Ideally you can have them call me to schedule that directly. If they call me, great! But, regardless, please get the adjuster's information (name, email, phone number) and send that over to me so that I can communicate with them before the inspection. If they insist on scheduling with you, go ahead and pencil in a time and avoid these times and days [provide your schedule]

Answer any questions that the HO may have

"Thank you, sir/ma'am, looking forward to seeing you on the day of inspection, you have my contact information on my card if you need anything else."`
  },
  {
    id: 'insurance-pushback',
    title: 'Insurance Pushback & Arguments (Q1-Q100)',
    category: 'pushback',
    description: 'Comprehensive responses to insurance company objections',
    content: `Insurance Pushback & Arguments Playbook

Q1: "We don't see enough damage to warrant replacement."
Short: Our photo report shows functional storm damage (creases, missing shingles) beyond repair. This requires full replacement.

Detailed Email: To whom it may concern, Please see the attached photo report documenting storm-related damage on multiple slopes. The photos clearly show creased and missing shingles, which are consistent with functional wind damage and cannot be repaired without causing further harm. Per standard industry practice, this constitutes irreparability, and a full replacement is required to restore the property to its pre-loss condition. We respectfully request that your estimate be revised accordingly.

Q2: "Hail is cosmetic and doesn't affect function."
Short: Hail damage is not cosmetic - it causes granule loss, mat fractures, and sealant bond failures, per GAF.

Detailed Email: To whom it may concern, Your denial states that hail damage is cosmetic only. However, per GAF Storm Damage Guidelines, hail impact causes functional issues such as granule loss, cracks in the asphalt mat, and compromised sealant bonds. These defects accelerate roof deterioration and shorten lifespan, making the roof irreparable. For these reasons, this damage cannot be dismissed as cosmetic. Please update your estimate to reflect full roof replacement.

Q3: "Shingles can be patched."
Short: The iTel report confirms the shingles are discontinued; patching would cause mismatches and fail manufacturer standards.

Detailed Email: To whom it may concern, Your position that the roof can be patched is not consistent with the findings of the attached iTel report, which confirms that the installed shingles are discontinued. Per the Discontinued Shingle List, no comparable replacements exist. Mixing discontinued shingles with available alternatives creates mismatches in size, color, and sealant bond, violating manufacturer standards. The only viable and code-compliant option is full replacement.

Q4: "We don't see storm-related damage."
Short: Our photo report documents collateral and shingle damage consistent with the reported storm event. Latent storm damage may not be immediately visible.

Detailed Email: To whom it may concern, Your denial states no storm-related damage was found. Please review the attached photo report, which documents collateral impacts to gutters, soft metals, and shingles. These damage patterns are consistent with the storm event reported and align with industry-recognized storm signatures. Additionally, per GAF Storm Damage Guidelines, latent damage from wind or hail may not be visible immediately but still compromises long-term performance. We ask that the scope be reconsidered with this evidence in mind.

Q5: "The roof is still functional."
Short: Coverage isn't based on functionality - cracked shingles and exposed mats void warranties and require replacement.

Detailed Email: To whom it may concern, While you noted the roof is "still functional," coverage is not determined by whether a roof is currently leaking but by restoring the property to its pre-loss condition. The attached documentation shows cracked shingles and exposed fiberglass mats. Per GAF Storm Damage Guidelines, these conditions void the manufacturer's warranty and compromise the integrity of the system. Repair is not feasible, and replacement is required to bring the property back to pre-storm condition.

[Continue with remaining Q&A points as needed...]

For full playbook with all 100 questions, refer to the complete Pushback PDF document.`
  },
  {
    id: 'retail-pitch',
    title: 'Retail Store Approach',
    category: 'retail',
    description: 'Big-box store neighbor notification pitch for lead generation',
    voice: 'agnes_21',
    content: `Retail Pitch

Hello, how are you?

"Eh, you know, working lol"

"You look ________, I'll be quick"

My name is ___________.

I'm just giving the neighbors a heads up

Our company is about to do the (product) for one of your neighbors. (POINT)

So, before we get going, we are going to come by, and we are going to do free quotes.

So far, we're coming by for everybody in the afternoons, or are the evenings better for you?

Great! My job is simple.
1. I get your name
2. I'll find a time that works best for you
3. Leave you with a flyer

---

Key Points:
- Keep it quick and friendly
- Use the neighbor angle to create social proof
- Get commitment on timing preference
- Leave with contact info collected

Voice Selection: This script works best with Agnes 21 or 21 voice for TTS playback.`
  }
];

/**
 * Get script by ID
 */
export const getScriptById = (id: string): PhoneScript | undefined => {
  return PHONE_SCRIPTS.find(script => script.id === id);
};

/**
 * Get scripts by category
 */
export const getScriptsByCategory = (category: PhoneScript['category']): PhoneScript[] => {
  return PHONE_SCRIPTS.filter(script => script.category === category);
};

/**
 * Get all script categories
 */
export const getScriptCategories = (): PhoneScript['category'][] => {
  return ['estimate', 'objection', 'authorization', 'pushback', 'retail'];
};
