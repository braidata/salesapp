export const mockOrdersData = {
  list: [
    {
      orderId: "84759302857-01",
      sequence: "1234",
      creationDate: "2024-01-20T10:30:00.000Z",
      lastChange: "2024-01-21T15:45:00.000Z",
      status: "invoiced",
      statusDescription: "Facturado",
      value: 150000,
      totals: [
        { id: "Items", name: "Items", value: 120000 },
        { id: "Shipping", name: "Shipping", value: 30000 },
      ],
      items: [
        {
          uniqueId: "item-1",
          id: "101",
          name: "Producto A",
          refId: "REF101",
          productId: "P101",
          quantity: 2,
          price: 60000,
          listPrice: 75000,
          sellingPrice: 60000,
          imageUrl: "https://example.com/product-a.jpg",
          additionalInfo: { brandName: "Marca X" },
        },
      ],
      clientProfileData: {
        firstName: "Juan",
        lastName: "Pérez",
        email: "juan.perez@example.com",
        phone: "+56912345678",
        document: "12345678-9",
        isCorporate: false,
      },
      shippingData: {
        address: {
          receiverName: "Juan Pérez",
          street: "Avenida Principal",
          number: "123",
          complement: "Departamento 4B",
          neighborhood: "Providencia",
          city: "Santiago",
          state: "RM",
          postalCode: "7500000",
          country: "CL",
        },
        logisticsInfo: [
          {
            deliveryCompany: "Chilexpress",
            shippingEstimateDate: "2024-01-25T00:00:00.000Z",
            selectedSla: "Standard",
          },
        ],
      },
      paymentData: {
        transactions: [
          {
            payments: [
              {
                paymentSystemName: "Webpay",
                value: 150000,
                installments: 3,
                tid: "1234567890",
                status: "approved",
                connectorResponses: {
                  nsu: "9876543210",
                  authorizationCode: "AUTH123",
                },
              },
            ],
          },
        ],
      },
    },
    {
      orderId: "56283910746-02",
      sequence: "5678",
      creationDate: "2024-01-22T14:20:00.000Z",
      lastChange: "2024-01-23T09:10:00.000Z",
      status: "handling",
      statusDescription: "En preparación",
      value: 80000,
      totals: [
        { id: "Items", name: "Items", value: 70000 },
        { id: "Shipping", name: "Shipping", value: 10000 },
      ],
      items: [
        {
          uniqueId: "item-2",
          id: "202",
          name: "Producto B",
          refId: "REF202",
          productId: "P202",
          quantity: 1,
          price: 70000,
          listPrice: 80000,
          sellingPrice: 70000,
          imageUrl: "https://example.com/product-b.jpg",
          additionalInfo: { brandName: "Marca Y" },
        },
      ],
      clientProfileData: {
        firstName: "María",
        lastName: "González",
        email: "maria.gonzalez@example.com",
        phone: "+56987654321",
        document: "98765432-1",
        isCorporate: false,
      },
      shippingData: {
        address: {
          receiverName: "María González",
          street: "Calle Secundaria",
          number: "456",
          complement: "Casa",
          neighborhood: "Ñuñoa",
          city: "Santiago",
          state: "RM",
          postalCode: "7700000",
          country: "CL",
        },
        logisticsInfo: [
          {
            deliveryCompany: "Starken",
            shippingEstimateDate: "2024-01-27T00:00:00.000Z",
            selectedSla: "Express",
          },
        ],
      },
      paymentData: {
        transactions: [
          {
            payments: [
              {
                paymentSystemName: "credit_card",
                value: 80000,
                installments: 1,
                tid: "0987654321",
                status: "approved",
                connectorResponses: {
                  nsu: "1234567890",
                  authorizationCode: "AUTH456",
                },
              },
            ],
          },
        ],
      },
    },
    {
      orderId: "91827364501-03",
      sequence: "9012",
      creationDate: "2024-01-24T09:00:00.000Z",
      lastChange: "2024-01-24T12:30:00.000Z",
      status: "delivered",
      statusDescription: "Entregado",
      value: 220000,
      totals: [
        { id: "Items", name: "Items", value: 200000 },
        { id: "Shipping", name: "Shipping", value: 20000 },
      ],
      items: [
        {
          uniqueId: "item-3",
          id: "303",
          name: "Producto C",
          refId: "REF303",
          productId: "P303",
          quantity: 3,
          price: 66666,
          listPrice: 70000,
          sellingPrice: 66666,
          imageUrl: "https://example.com/product-c.jpg",
          additionalInfo: { brandName: "Marca Z" },
        },
      ],
      clientProfileData: {
        firstName: "Pedro",
        lastName: "Sánchez",
        email: "pedro.sanchez@example.com",
        phone: "+56934567890",
        document: "54321678-K",
        isCorporate: false,
      },
      shippingData: {
        address: {
          receiverName: "Pedro Sánchez",
          street: "Pasaje Interior",
          number: "789",
          complement: "Oficina 201",
          neighborhood: "Las Condes",
          city: "Santiago",
          state: "RM",
          postalCode: "7550000",
          country: "CL",
        },
        logisticsInfo: [
          {
            deliveryCompany: "BlueExpress",
            shippingEstimateDate: "2024-01-26T00:00:00.000Z",
            selectedSla: "Priority",
          },
        ],
      },
      paymentData: {
        transactions: [
          {
            payments: [
              {
                paymentSystemName: "bank_transfer",
                value: 220000,
                installments: 1,
                tid: "5678901234",
                status: "approved",
                connectorResponses: {
                  nsu: "0987654321",
                  authorizationCode: "AUTH789",
                },
              },
            ],
          },
        ],
      },
    },
    {
      orderId: "27384950617-04",
      sequence: "3456",
      creationDate: "2024-01-26T16:45:00.000Z",
      lastChange: "2024-01-27T11:22:00.000Z",
      status: "canceled",
      statusDescription: "Cancelado",
      value: 55000,
      totals: [
        { id: "Items", name: "Items", value: 50000 },
        { id: "Discounts", name: "Discounts", value: -5000 },
      ],
      items: [
        {
          uniqueId: "item-4",
          id: "404",
          name: "Producto D",
          refId: "REF404",
          productId: "P404",
          quantity: 1,
          price: 50000,
          listPrice: 60000,
          sellingPrice: 50000,
          imageUrl: "https://example.com/product-d.jpg",
          additionalInfo: { brandName: "Marca W" },
        },
      ],
      clientProfileData: {
        firstName: "Ana",
        lastName: "Rodríguez",
        email: "ana.rodriguez@example.com",
        phone: "+56923456789",
        document: "78901234-5",
        isCorporate: false,
      },
      shippingData: {
        address: {
          receiverName: "Ana Rodríguez",
          street: "Avenida Central",
          number: "901",
          complement: "Piso 12",
          neighborhood: "Providencia",
          city: "Santiago",
          state: "RM",
          postalCode: "7500000",
          country: "CL",
        },
        logisticsInfo: [
          {
            deliveryCompany: "DHL",
            shippingEstimateDate: "2024-01-30T00:00:00.000Z",
            selectedSla: "Worldwide Express",
          },
        ],
      },
      paymentData: {
        transactions: [
          {
            payments: [
              {
                paymentSystemName: "debit_card",
                value: 55000,
                installments: 1,
                tid: "9012345678",
                status: "denied",
                connectorResponses: {
                  nsu: "5432109876",
                  authorizationCode: "AUTH000",
                },
              },
            ],
          },
        ],
      },
    },
    {
      orderId: "16273849506-05",
      sequence: "6789",
      creationDate: "2024-01-28T07:15:00.000Z",
      lastChange: "2024-01-29T18:50:00.000Z",
      status: "ready-for-handling",
      statusDescription: "Listo para preparar",
      value: 95000,
      totals: [
        { id: "Items", name: "Items", value: 85000 },
        { id: "Shipping", name: "Shipping", value: 10000 },
      ],
      items: [
        {
          uniqueId: "item-5",
          id: "505",
          name: "Producto E",
          refId: "REF505",
          productId: "P505",
          quantity: 1,
          price: 85000,
          listPrice: 90000,
          sellingPrice: 85000,
          imageUrl: "https://example.com/product-e.jpg",
          additionalInfo: { brandName: "Marca V" },
        },
      ],
      clientProfileData: {
        firstName: "Carlos",
        lastName: "López",
        email: "carlos.lopez@example.com",
        phone: "+56945678901",
        document: "34567890-2",
        isCorporate: false,
      },
      shippingData: {
        address: {
          receiverName: "Carlos López",
          street: "Calle Nueva",
          number: "234",
          complement: "Local 1",
          neighborhood: "Santiago Centro",
          city: "Santiago",
          state: "RM",
          postalCode: "8320000",
          country: "CL",
        },
        logisticsInfo: [
          {
            deliveryCompany: "Chilexpress",
            shippingEstimateDate: "2024-02-02T00:00:00.000Z",
            selectedSla: "Priority",
          },
        ],
      },
      paymentData: {
        transactions: [
          {
            payments: [
              {
                paymentSystemName: "webpay",
                value: 95000,
                installments: 6,
                tid: "2345678901",
                status: "pending",
                connectorResponses: {
                  nsu: "6543210987",
                  authorizationCode: "AUTH555",
                },
              },
            ],
          },
        ],
      },
    },
  ],
}

