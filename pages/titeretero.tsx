import { GetServerSideProps } from 'next';
import Titere from '../components/titere';
import Titere2 from '../components/titere2';
import TiterePerro from '../components/titerePerro';

interface TiterePageProps {
  url: string;
}

const TiterePage: React.FC<TiterePageProps> = ({ url }) => {
  return <Titere url={url} />;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const url = context.query.url as string || 'https://braidata.com/';
  return { props: { url } };
};

export default TiterePage;