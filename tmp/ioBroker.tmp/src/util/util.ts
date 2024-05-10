export type Product = {
    name: string;
    icon: string;
    ancp: Record<string | number, string>;
};

const Products = new Map<string, Product>([
    [
        '358',
        {
            name: 'Dyson Pure Humidify+Cool',
            icon: 'icons/purifier-humidifiers.png',
            ancp: { 0: '0', 45: '45', 90: '90', BRZE: 'Breeze' },
        },
    ],
    [
        '358E',
        {
            name: 'Dyson Pure Humidify+Cool',
            icon: 'icons/purifier-humidifiers.png',
            ancp: { 0: '0', 45: '45', 90: '90', BRZE: 'Breeze' },
        },
    ],
    [
        '358K',
        {
            name: 'Dyson Pure Humidify+Cool Formaldehyde',
            icon: 'icons/purifier-humidifiers.png',
            ancp: { 0: '0', 45: '45', 90: '90', BRZE: 'Breeze' },
        },
    ],
    [
        '438',
        {
            name: 'Dyson Pure Cool Tower',
            icon: 'icons/purifiers.png',
            ancp: {
                0: '0',
                45: '45',
                90: '90',
                180: '180',
                350: '350',
                CUST: 'Custom',
            },
        },
    ],
    [
        '438E',
        {
            name: 'Dyson Pure Cool Tower Formaldehyde',
            icon: 'icons/purifiers.png',
            ancp: {
                0: '0',
                45: '45',
                90: '90',
                180: '180',
                350: '350',
                CUST: 'Custom',
            },
        },
    ],
    [
        '438K',
        {
            name: 'Dyson Pure Cool Tower Formaldehyde',
            icon: 'icons/purifiers.png',
            ancp: {
                0: '0',
                45: '45',
                90: '90',
                180: '180',
                350: '350',
                CUST: 'Custom',
            },
        },
    ],
    [
        '455',
        {
            name: 'Dyson Pure Hot+Cool Link',
            icon: 'icons/heaters.png',
            ancp: {
                0: '0',
                45: '45',
                90: '90',
                180: '180',
                350: '350',
                CUST: 'Custom',
            },
        },
    ],
    [
        '455A',
        {
            name: 'Dyson Pure Hot+Cool Link',
            icon: 'icons/heaters.png',
            ancp: {
                0: '0',
                45: '45',
                90: '90',
                180: '180',
                350: '350',
                CUST: 'Custom',
            },
        },
    ],
    ['469', { name: 'Dyson Pure Cool Link Desk', icon: 'icons/fans.png', ancp: {} }],
    [
        '475',
        {
            name: 'Dyson Pure Cool Link Tower',
            icon: 'icons/purifiers.png',
            ancp: {
                0: '0',
                45: '45',
                90: '90',
                180: '180',
                350: '350',
                CUST: 'Custom',
            },
        },
    ],
    ['520', { name: 'Dyson Pure Cool Desk', icon: 'icons/fans.png', ancp: {} }],
    [
        '527',
        {
            name: 'Dyson Pure Hot+Cool',
            icon: 'icons/heaters.png',
            ancp: {
                0: '0',
                45: '45',
                90: '90',
                180: '180',
                350: '350',
                CUST: 'Custom',
            },
        },
    ],
    [
        '527E',
        {
            name: 'Dyson Pure Hot+Cool',
            icon: 'icons/heaters.png',
            ancp: {
                0: '0',
                45: '45',
                90: '90',
                180: '180',
                350: '350',
                CUST: 'Custom',
            },
        },
    ],
    [
        '527K',
        {
            name: 'Dyson Pure Hot+Cool Formaldehyde',
            icon: 'icons/heaters.png',
            ancp: {
                0: '0',
                45: '45',
                90: '90',
                180: '180',
                350: '350',
                CUST: 'Custom',
            },
        },
    ],
]);

export function getProduct(productType: string) {
    return Products.get(productType);
}
