export const mockTranscriptions = [
  {
    id: 1,
    text: `Customer: Hello, I want to report some unauthorized transactions from my account.

Agent: Good afternoon, sir. I'm sorry to hear that. Can you please provide your account number for verification?

Customer: Yes, it's ending in 8901. I noticed three transactions yesterday that I did not make.

Agent: I can see those transactions. Can you confirm when you last used your mobile banking?

Customer: I used it three days ago to check my balance. But yesterday I received OTPs on my phone which I did not request.

Agent: Did you share these OTPs with anyone?

Customer: No, absolutely not. I was at work when these transactions happened. I have witnesses.

Agent: I understand. We will block your mobile banking immediately and start an investigation. You will receive a reference number shortly.

Customer: Thank you. Please look into this urgently.`,
  },
  {
    id: 2,
    text: `Customer: I'm calling about fraud on my account. Someone transferred money without my permission.

Agent: I'm sorry to hear that. Let me pull up your account. Can you verify your CNIC last 4 digits?

Customer: 5678.

Agent: Thank you. I can see a transaction of Rs. 125,000 to an unknown beneficiary. When did you notice this?

Customer: This morning when I tried to withdraw cash from ATM and my balance was low.

Agent: Do you recall receiving any calls or messages asking for your banking details?

Customer: Actually yes, someone called yesterday claiming to be from the bank's security team. They said my account was compromised and asked me to verify my details.

Agent: I see. Did you provide any information to them?

Customer: I... I gave them my CNIC and the OTP that came to my phone. They said it was for verification.

Agent: Sir, the bank never asks for OTPs over phone. This appears to be a social engineering fraud. We will file this case but I must inform you that sharing OTP may affect the liability assessment.`,
  },
  {
    id: 3,
    text: `Customer: My phone was stolen two days ago and now I see transactions I didn't make.

Agent: I'm sorry about your phone. Did you report it to the police?

Customer: Yes, I have the FIR. The thief made transactions using my mobile banking.

Agent: Were you using biometric login or PIN for your mobile banking?

Customer: PIN. But it was a simple PIN, I think they guessed it.

Agent: How many transactions do you see that are unauthorized?

Customer: Two transactions, total Rs. 200,000, both to the same account.

Agent: I'll block your mobile banking and debit card immediately. Did you have any banking apps open when the phone was stolen?

Customer: I don't think so. I was at the market when someone snatched it from my hand.

Agent: We'll need a copy of your FIR and a written statement. Please visit your branch with these documents to complete the dispute filing.`,
  },
  {
    id: 4,
    text: `Agent: This is a follow-up call regarding case IBMB-2025-000003. Am I speaking with Mr. Usman?

Customer: Yes, speaking.

Agent: Sir, I'm calling from the fraud investigation unit. We've reviewed your case and have some questions.

Customer: Yes, please go ahead.

Agent: Our records show that a new device was registered on your mobile banking on January 17th. Were you aware of this?

Customer: No, I wasn't. I only use my Samsung phone for banking.

Agent: The transactions were made from an iPhone. Also, we noticed a SIM swap request was processed on January 16th.

Customer: What? I never requested any SIM swap. My SIM was working fine until it suddenly stopped working on the 17th.

Agent: That confirms our suspicion. This appears to be a SIM swap fraud. Someone obtained a duplicate SIM and used it to bypass OTP authentication.

Customer: Can the bank recover my money?

Agent: We've already filed FTDH with the beneficiary bank. We're working to freeze those funds. I'll update you within 48 hours.`,
  },
];

export const getRandomTranscription = () => {
  const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
  return mockTranscriptions[randomIndex].text;
};

export default mockTranscriptions;
