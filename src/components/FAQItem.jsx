import { useState } from 'react';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <article className={`faq-item ${isOpen ? 'show-answer' : ''}`}>
      <div className="item-question" onClick={() => setIsOpen(!isOpen)}>
        <span className="question-text">{question}</span>
        <span className="arrow-icon">▼</span>
      </div>
      <div className="answer-wrapper">
        <div className="item-answer">
          <span className="answer-text">{answer}</span>
        </div>
      </div>
    </article>
  );
};

export default FAQItem;
