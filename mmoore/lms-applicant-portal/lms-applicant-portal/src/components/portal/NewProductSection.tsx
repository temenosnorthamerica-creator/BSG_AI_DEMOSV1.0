import { useNavigate } from 'react-router-dom';
import { Button } from '../common';

export function NewProductSection() {
  const navigate = useNavigate();

  const handleExplore = () => {
    navigate('/products');
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-primary text-center mb-2">
        Interested in a new product
      </h2>
      <p className="text-gray-600 text-center mb-4">
        Whether you are pre-approved or interested in a new product, we got you covered...
      </p>
      <div className="flex justify-center">
        <Button variant="orange" onClick={handleExplore}>
          Explore our offerings
        </Button>
      </div>
    </div>
  );
}
