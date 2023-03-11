import React from 'react';

const data = [
    { id: 1, title: 'Mueve tus favoritos rápidamente', imageUrl: 'https://edgefrecdn.azureedge.net/tips/cms/lrs1tuvjki/tip-thumbnails/3af5bf5491854ebca59897a6d531effd.png' },
    { id: 2, title: 'Otra tarjeta de ejemplo', imageUrl: 'https://picsum.photos/seed/picsum/200/300' },
  ];

const Card = ({ title, imageUrl }) => {
  return (
    <div className="card-grid__card w-56 p-3">
      <button
        data-bi-id-display="tip-card-3-rendimiento"
        className="tip-card tip-card--mode-small tip-card--clickable tip-card--size-md tip-collection-feature__card h-48"
      >
        <div className="tip-card__thumb h-full" style={{ backgroundImage: `url(${imageUrl})` }}></div>
        <div className="tip-card__content">
          <div className="tip-card__title">
            <span>{title}</span>
          </div>
        </div>
        <svg viewBox="0 0 8 8" width="8" xmlns="http://www.w3.org/2000/svg" className="tip-card__popup-arrow">
          <path d="M1.794 0a.888.888 0 1 0 0 1.776H4.97L.273 6.472a.888.888 0 1 0 1.255 1.255l4.696-4.696v3.184a.888.888 0 1 0 1.776 0V.888A.888.888 0 0 0 7.112 0H1.794Z" fill="#FFF" fillRule="nonzero"></path>
        </svg>
        <div className="tip-card__selection"></div>
      </button>
    </div>
  );
};

const CardList = ({ data }) => {
  return (
    <div className="card-grid grid grid-cols-2 gap-4">
      {data.map(({ id, title, imageUrl }) => (
        <Card key={id} title={title} imageUrl={imageUrl} />
      ))}
    </div>
  );
};

const ExamplePage = ({ data }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold">Example Page</h1>
      <CardList data={data} />
    </div>
  );
};

export async function getStaticProps() {
  // Aquí puedes obtener los datos que necesitas y pasarlos a la página
  const data = [
    { id: 1, title: 'Mueve tus favoritos rápidamente', imageUrl: 'https://edgefrecdn.azureedge.net/tips/cms/lrs1tuvjki/tip-thumbnails/3af5bf5491854ebca59897a6d531effd.png' },
    { id: 2, title: 'Otra tarjeta de ejemplo', imageUrl: 'https://picsum.photos/seed/picsum/200/300' },
  ];

  return {
    props: {
      data,
    },
  };
}

export default ExamplePage(JSON.parse(data));