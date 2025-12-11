/**
 * Predefined list of companies for verification requests
 * These are the companies that verifiers can select when making verification requests
 */

export const VERIFICATION_COMPANIES = [
    {
        id: 'tvs_credit',
        name: 'TVS Credit Services Limited',
        shortName: 'TVS Credit'
    },
    {
        id: 'bajaj_finance',
        name: 'Bajaj Finance Limited',
        shortName: 'Bajaj Finance'
    },
    {
        id: 'hdfc_bank',
        name: 'HDFC Bank Limited',
        shortName: 'HDFC Bank'
    }
];

/**
 * Get company by ID
 * @param {string} companyId - Company ID
 * @returns {Object|null} Company object or null if not found
 */
export function getCompanyById(companyId) {
    return VERIFICATION_COMPANIES.find(c => c.id === companyId) || null;
}

/**
 * Get company by name
 * @param {string} companyName - Company name (full or short)
 * @returns {Object|null} Company object or null if not found
 */
export function getCompanyByName(companyName) {
    const normalizedName = companyName.toLowerCase();
    return VERIFICATION_COMPANIES.find(
        c => c.name.toLowerCase() === normalizedName ||
            c.shortName.toLowerCase() === normalizedName
    ) || null;
}

export default VERIFICATION_COMPANIES;
