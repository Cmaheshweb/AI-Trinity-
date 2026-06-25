import React from 'react';
import Link from 'next/link';
import Button from './Button';

interface FeatureCardProps {
  title: string;
  description: string;
  link: string;
  buttonText: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, link, buttonText }) => {
  return (
    <div className="bg-light p-6 rounded-lg shadow-md hover:shadow-lg transition duration-200 flex flex-col justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-dark mb-3">{title}</h2>
        <p className="text-gray-700 mb-4">{description}</p>
      </div>
      <Link href={link}>
        <Button className="w-full" variant="primary">
          {buttonText}
        </Button>
      </Link>
    </div>
  );
};

export default FeatureCard;