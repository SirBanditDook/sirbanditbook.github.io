import FAQItem from './FAQItem';

const faqData = [
  {
    question: "Who are you?",
    answer: "My name is Bandit! I'm a ferret \"kemonomimi\" (which is just someone who's trying to not be a furry, just someone who likes having a tail). I'm a \"streamer\" who mainly likes to program, hence this website, play any game that peaks my interest and sit there with my girlfriend Raekomiii!"
  },
  {
    question: "What is this website?",
    answer: "This website is just somewhere to show who I am, test out features and just generally mess around! (if you're hiring... please hire me even though I might not know everything I can LEARN)"
  },
  {
    question: "When do you stream?",
    answer: "I stream honestly whenever I can AND have the... want(?) to. So there isn't a set schedule but there are more likely days, like Fridays and Saturdays."
  }
];

const FAQList = () => {
  return (
    <div id="faqs-container">
      {faqData.map((item, index) => (
        <FAQItem key={index} question={item.question} answer={item.answer} />
      ))}
    </div>
  );
};

export default FAQList;
