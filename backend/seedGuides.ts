import prisma from './src/utils/prisma';

const guides = [
  {
    title: 'Recognizing PTSD Signs in Survivors',
    tags: 'PTSD, Detection, Early Warning',
    content: 'Post-Traumatic Stress Disorder (PTSD) can develop after exposure to a terrifying event. Look for these signs:\n\n1. Intrusive memories or flashbacks.\n2. Avoidance of reminders of the trauma.\n3. Negative changes in thinking and mood (e.g., emotional numbness, hopelessness).\n4. Changes in physical and emotional reactions (e.g., being easily startled, aggressive behavior).\n\nAction: If you observe these symptoms lasting more than a month, gently refer the individual to a certified trauma specialist.'
  },
  {
    title: 'Grounding Techniques for Panic Attacks',
    tags: 'Panic, Grounding, Anxiety, Immediate Relief',
    content: 'When someone is experiencing a panic attack, their nervous system goes into overdrive. Use the 5-4-3-2-1 Grounding Technique to bring them back to the present:\n\nAsk them to identify:\n- 5 things they can see.\n- 4 things they can touch (and ask them to touch them).\n- 3 things they can hear.\n- 2 things they can smell.\n- 1 thing they can taste.\n\nKeep your voice calm and steady. Do not tell them to "calm down." Say, "You are safe. I am here with you."'
  },
  {
    title: 'Crisis De-escalation Scripts',
    tags: 'De-escalation, Conflict, Anger',
    content: 'In highly stressful environments like disaster camps, tempers can flare. Use these scripts to de-escalate:\n\n- "I can see you are very upset, and you have every right to be. Let us figure this out together."\n- "I want to help you, but I need you to speak a little slower so I can understand exactly what you need."\n- "I hear that you are frustrated about the food distribution. Let me check with the coordinator right now."\n\nAvoid crossing your arms, maintain a safe distance, and keep your body language open.'
  },
  {
    title: 'Supporting Children in Disaster Zones',
    tags: 'Children, Pediatrics, Comfort',
    content: 'Children process trauma differently than adults. They may regress in behavior (e.g., bed-wetting) or become unusually quiet or clingy.\n\n- Provide a safe, predictable routine as much as possible.\n- Answer their questions honestly but simply, without sharing frightening details.\n- Encourage them to draw or play, as this is how children often process complex emotions.\n- Reassure them repeatedly that the disaster was not their fault and that adults are working to keep them safe.'
  },
  {
    title: 'Compassion Fatigue for Volunteers',
    tags: 'Self-Care, Burnout, Volunteers',
    content: 'As a volunteer, you are absorbing a immense amount of trauma from others. Compassion fatigue is a state of physical and mental exhaustion.\n\nSigns you need a break:\n- Feeling numb or detached from the survivors.\n- Irritability with your team.\n- Difficulty sleeping.\n\nAction: Enforce your mandatory rest periods. Talk to your team lead if you feel overwhelmed. You cannot pour from an empty cup.'
  },
  {
    title: 'Supporting the Bereaved',
    tags: 'Grief, Loss, Bereavement',
    content: 'When someone has lost a loved one in the disaster:\n\n- Avoid saying "They are in a better place" or "I know how you feel."\n- Do say: "I am so sorry for your loss. I am here for you."\n- Offer practical help (e.g., bringing water, sitting with them in silence).\n- Allow them to express anger or cry without trying to "fix" their pain. Grief is a process that needs to be felt.'
  },
  {
    title: 'Identifying Substance Abuse Risks',
    tags: 'Substance Abuse, Coping Mechanisms',
    content: 'In the aftermath of trauma, some individuals may turn to alcohol or drugs to cope.\n\n- Watch for sudden changes in behavior, secretive actions, or the smell of alcohol.\n- Do not confront them aggressively.\n- Privately express your concern: "I have noticed you seem really stressed lately, and I want to make sure you have support."\n- Refer them to the medical tent for evaluation if they seem intoxicated.'
  },
  {
    title: 'Psychological First Aid (PFA) Basics',
    tags: 'PFA, Core Principles',
    content: 'Psychological First Aid is not professional therapy; it is compassionate support.\n\nThe 3 Action Principles of PFA:\n1. LOOK: Check for safety, check for people with obvious urgent basic needs, check for people with serious distress reactions.\n2. LISTEN: Approach people who may need support, ask about their needs and concerns, listen to them, and help them feel calm.\n3. LINK: Help people address basic needs and access services, help people cope with problems, give information, and connect people with loved ones and social support.'
  }
];

async function main() {
  console.log('Seeding Mental Health Guides...');
  for (const guide of guides) {
    await prisma.mentalHealthGuide.create({
      data: guide
    });
  }
  console.log(`Seeded ${guides.length} guides.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
