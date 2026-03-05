import Button from '../../../components/ui/Button';

const SocialLoginButton = ({ provider, iconName, onClick }) => {
  return (
    <Button
      type="button"
      variant="outline"
      iconName={iconName}
      iconPosition="left"
      onClick={onClick}
      fullWidth
    >
      {provider}
    </Button>
  );
};

export default SocialLoginButton;