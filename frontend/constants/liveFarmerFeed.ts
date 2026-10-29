/**
 * Pan-India Live Farmer Social Proof Feed
 * Diverse representation of 220+ Indian cultivators from every state and community,
 * dynamically paired with current season crops and realistic agronomy actions.
 */

export interface LiveFarmerActivity {
  id: number;
  emoji: string;
  name: string;
  location: string;
  action: string;
  detail: string;
  timeAgo: string;
  tagColor: string;
}

// ── 220+ Authentic Pan-India Cultivators (All Regions & Communities) ──
export const PAN_INDIA_FARMERS: Array<{ name: string; location: string }> = [
  // ── Punjab & Haryana (Sikh, Hindu Jat, Punjabi Cultivators) ──
  { name: 'Sardar Gurmukh Singh', location: 'Sangrur, Punjab' },
  { name: 'Harpreet Singh Gill', location: 'Moga, Punjab' },
  { name: 'Kuldeep Singh Dhillon', location: 'Bathinda, Punjab' },
  { name: 'Balwinder Singh Sandhu', location: 'Ludhiana, Punjab' },
  { name: 'Jagtar Singh Brar', location: 'Amritsar, Punjab' },
  { name: 'Manpreet Singh Cheema', location: 'Patiala, Punjab' },
  { name: 'Jaswant Singh Randhawa', location: 'Gurdaspur, Punjab' },
  { name: 'Amarjit Singh Kang', location: 'Ferozepur, Punjab' },
  { name: 'Sukhwinder Singh Sidhu', location: 'Muktsar, Punjab' },
  { name: 'Daljit Singh Mann', location: 'Fazilka, Punjab' },
  { name: 'Gurdeep Singh Bajwa', location: 'Hoshiarpur, Punjab' },
  { name: 'Harjinder Singh Toor', location: 'Fatehgarh Sahib, Punjab' },
  { name: 'Baldev Singh Kahlon', location: 'Barnala, Punjab' },
  { name: 'Amrik Singh Dhaliwal', location: 'Tarn Taran, Punjab' },
  { name: 'Parminder Singh Sekhon', location: 'Kapurthala, Punjab' },
  { name: 'Satnam Singh Grewal', location: 'Rupnagar, Punjab' },
  { name: 'Hardip Singh Bains', location: 'Nawanshahr, Punjab' },
  { name: 'Bhupinder Singh Boparai', location: 'Jalandhar, Punjab' },
  { name: 'Jaspreet Singh Deol', location: 'Faridkot, Punjab' },
  { name: 'Shamsher Singh Virk', location: 'Karnal, Haryana' },
  { name: 'Virender Singh Hooda', location: 'Rohtak, Haryana' },
  { name: 'Joginder Singh Malik', location: 'Sonipat, Haryana' },
  { name: 'Randeep Singh Dahiya', location: 'Panipat, Haryana' },
  { name: 'Satbir Singh Punia', location: 'Hisar, Haryana' },
  { name: 'Kulwant Singh Chautala', location: 'Sirsa, Haryana' },
  { name: 'Mahabir Singh Phogat', location: 'Bhiwani, Haryana' },
  { name: 'Dharamveer Singh Tewatia', location: 'Kurukshetra, Haryana' },
  { name: 'Rajinder Singh Ahlawat', location: 'Jhajjar, Haryana' },
  { name: 'Ravinder Singh Nain', location: 'Jind, Haryana' },
  { name: 'Surender Singh Boora', location: 'Fatehabad, Haryana' },
  { name: 'Naresh Kumar Garg', location: 'Kaithal, Haryana' },
  { name: 'Anil Kumar Singla', location: 'Mansa, Punjab' },
  { name: 'Rameshwar Dayal Sharma', location: 'Ambala, Haryana' },
  { name: 'Dharampal Gujjar', location: 'Yamunanagar, Haryana' },

  // ── Uttar Pradesh, Uttarakhand & Himachal Pradesh ──
  { name: 'Rakesh Kumar Sharma', location: 'Meerut, UP' },
  { name: 'Brijesh Yadav', location: 'Etawah, UP' },
  { name: 'Dinesh Chandra Maurya', location: 'Varanasi, UP' },
  { name: 'Ram Sewak Tiwari', location: 'Gorakhpur, UP' },
  { name: 'Mahendra Pratap Singh', location: 'Bareilly, UP' },
  { name: 'Arvind Kumar Verma', location: 'Barabanki, UP' },
  { name: 'Devendra Gangwar', location: 'Pilibhit, UP' },
  { name: 'Suresh Chandra Lodhi', location: 'Bulandshahr, UP' },
  { name: 'Ashok Kumar Chauhan', location: 'Aligarh, UP' },
  { name: 'Vijay Pratap Singh', location: 'Budaun, UP' },
  { name: 'Ram Naresh Kushwaha', location: 'Jhansi, UP' },
  { name: 'Shiv Kumar Mishra', location: 'Ayodhya, UP' },
  { name: 'Satya Prakash Dubey', location: 'Prayagraj, UP' },
  { name: 'Radhey Shyam Gupta', location: 'Kanpur Dehat, UP' },
  { name: 'Chandra Bhan Singh', location: 'Mathura, UP' },
  { name: 'Gajendra Pal Singh', location: 'Moradabad, UP' },
  { name: 'Kripa Shankar Shukla', location: 'Basti, UP' },
  { name: 'Om Prakash Rajbhar', location: 'Azamgarh, UP' },
  { name: 'Harish Chandra Joshi', location: 'Udham Singh Nagar, Uttarakhand' },
  { name: 'Mohan Singh Rawat', location: 'Haridwar, Uttarakhand' },
  { name: 'Birender Singh Bisht', location: 'Dehradun, Uttarakhand' },
  { name: 'Puran Chand Negi', location: 'Shimla, Himachal Pradesh' },
  { name: 'Kulbhushan Sharma', location: 'Kullu, Himachal Pradesh' },
  { name: 'Rajesh Thakur', location: 'Kangra, Himachal Pradesh' },
  { name: 'Virender Singh Parmar', location: 'Solan, Himachal Pradesh' },
  { name: 'Prem Lal Verma', location: 'Mandi, Himachal Pradesh' },
  { name: 'Kishore Kumar Dogra', location: 'Hamirpur, Himachal Pradesh' },

  // ── Rajasthan & Gujarat ──
  { name: 'Devendra Singh Rathore', location: 'Alwar, Rajasthan' },
  { name: 'Hanuman Ram Meena', location: 'Jaipur, Rajasthan' },
  { name: 'Bhagwan Ram Godara', location: 'Bikaner, Rajasthan' },
  { name: 'Mangi Lal Jat', location: 'Nagaur, Rajasthan' },
  { name: 'Roopa Ram Choudhary', location: 'Jodhpur, Rajasthan' },
  { name: 'Kalu Ram Gurjar', location: 'Kota, Rajasthan' },
  { name: 'Bhairon Singh Shekhawat', location: 'Sikar, Rajasthan' },
  { name: 'Shrawan Ram Bishnoi', location: 'Barmer, Rajasthan' },
  { name: 'Ganpat Lal Saini', location: 'Jhunjhunu, Rajasthan' },
  { name: 'Laxman Das Vaishnav', location: 'Pali, Rajasthan' },
  { name: 'Chhagan Lal Kumawat', location: 'Ajmer, Rajasthan' },
  { name: 'Suraj Mal Dhabhai', location: 'Bhilwara, Rajasthan' },
  { name: 'Karan Singh Bhati', location: 'Jaisalmer, Rajasthan' },
  { name: 'Ramesh Bhai Patel', location: 'Rajkot, Gujarat' },
  { name: 'Bhavesh Kumar Shah', location: 'Mehsana, Gujarat' },
  { name: 'Jayesh Bhai Chaudhari', location: 'Banaskantha, Gujarat' },
  { name: 'Hitesh Bhai Desai', location: 'Patan, Gujarat' },
  { name: 'Mansukh Bhai Dobariya', location: 'Amreli, Gujarat' },
  { name: 'Kishor Bhai Vaghani', location: 'Junagadh, Gujarat' },
  { name: 'Nitin Bhai Solanki', location: 'Bhavnagar, Gujarat' },
  { name: 'Paresh Bhai Gadhavi', location: 'Kutch, Gujarat' },
  { name: 'Arvind Bhai Rabari', location: 'Sabarkantha, Gujarat' },
  { name: 'Ketan Bhai Parmar', location: 'Anand, Gujarat' },
  { name: 'Jagdish Bhai Barot', location: 'Gandhinagar, Gujarat' },
  { name: 'Mukesh Bhai Prajapati', location: 'Vadodara, Gujarat' },
  { name: 'Haresh Bhai Ahir', location: 'Jamnagar, Gujarat' },

  // ── Maharashtra & Goa ──
  { name: 'Anand Rao Shinde', location: 'Nashik, Maharashtra' },
  { name: 'Balasaheb Patil', location: 'Kolhapur, Maharashtra' },
  { name: 'Tukaram Jadhav', location: 'Satara, Maharashtra' },
  { name: 'Dnyaneshwar More', location: 'Pune, Maharashtra' },
  { name: 'Eknath Deshmukh', location: 'Sangli, Maharashtra' },
  { name: 'Pandurang Thorat', location: 'Ahmednagar, Maharashtra' },
  { name: 'Vithalrao Gaikwad', location: 'Solapur, Maharashtra' },
  { name: 'Sambhaji Bhosle', location: 'Chhatrapati Sambhajinagar, Maharashtra' },
  { name: 'Ramrao Chavan', location: 'Latur, Maharashtra' },
  { name: 'Sanjay Kulkarni', location: 'Jalgaon, Maharashtra' },
  { name: 'Uttamrao Wagh', location: 'Nagpur, Maharashtra' },
  { name: 'Baburao Sawant', location: 'Amravati, Maharashtra' },
  { name: 'Narayanrao Kale', location: 'Yavatmal, Maharashtra' },
  { name: 'Prabhakar Mhatre', location: 'Raigad, Maharashtra' },
  { name: 'Kashinath Gorde', location: 'Wardha, Maharashtra' },
  { name: 'Santoshrao Bonde', location: 'Buldhana, Maharashtra' },
  { name: 'Francisco Fernandes', location: 'Salcete, Goa' },
  { name: 'Antonio D\'Souza', location: 'Ponda, Goa' },

  // ── Madhya Pradesh & Chhattisgarh ──
  { name: 'Shivraj Singh Rajput', location: 'Ujjain, MP' },
  { name: 'Kailash Chandra Patidar', location: 'Indore, MP' },
  { name: 'Raghuvir Singh Tomar', location: 'Morena, MP' },
  { name: 'Bharat Lal Dangi', location: 'Sehore, MP' },
  { name: 'Kamal Kishore Malviya', location: 'Dewas, MP' },
  { name: 'Laxminarayan Meena', location: 'Vidisha, MP' },
  { name: 'Jagdish Prasad Chouksey', location: 'Narsinghpur, MP' },
  { name: 'Govind Ram Raghuwanshi', location: 'Hoshangabad, MP' },
  { name: 'Ramswaroop Bisen', location: 'Balaghat, MP' },
  { name: 'Babulal Kushwah', location: 'Gwalior, MP' },
  { name: 'Chhedilal Sahu', location: 'Raipur, Chhattisgarh' },
  { name: 'Brijlal Dewangan', location: 'Durg, Chhattisgarh' },
  { name: 'Dhaniram Netam', location: 'Bastar, Chhattisgarh' },
  { name: 'Ramsingh Gond', location: 'Bilaspur, Chhattisgarh' },
  { name: 'Pila Ram Patel', location: 'Rajnandgaon, Chhattisgarh' },

  // ── Bihar, Jharkhand, West Bengal & Odisha ──
  { name: 'Umesh Prasad Singh', location: 'Muzaffarpur, Bihar' },
  { name: 'Mithilesh Kumar Yadav', location: 'Samastipur, Bihar' },
  { name: 'Lallan Prasad Kushwaha', location: 'Rohtas, Bihar' },
  { name: 'Ramashray Sahni', location: 'Begusarai, Bihar' },
  { name: 'Shambhu Nath Jha', location: 'Darbhanga, Bihar' },
  { name: 'Sachchidanand Pandey', location: 'Buxar, Bihar' },
  { name: 'Awadhesh Kumar Mandal', location: 'Katihar, Bihar' },
  { name: 'Birendra Kumar Paswan', location: 'Gaya, Bihar' },
  { name: 'Birsa Munda', location: 'Khunti, Jharkhand' },
  { name: 'Shibu Soren', location: 'Dumka, Jharkhand' },
  { name: 'Sukhlal Mahto', location: 'Ranchi, Jharkhand' },
  { name: 'Dinesh Chandra Oraon', location: 'Gumla, Jharkhand' },
  { name: 'Kalyan Kumar Roy', location: 'Burdwan, West Bengal' },
  { name: 'Subhash Chandra Mondal', location: 'Nadia, West Bengal' },
  { name: 'Anup Kumar Ghosh', location: 'Hooghly, West Bengal' },
  { name: 'Debasish Bhowmick', location: 'Midnapore, West Bengal' },
  { name: 'Tapan Kumar Das', location: 'Murshidabad, West Bengal' },
  { name: 'Rabindra Nath Murmu', location: 'Bankura, West Bengal' },
  { name: 'Pranab Kumar Sen', location: 'Birbhum, West Bengal' },
  { name: 'Bibhuti Bhusan Sahoo', location: 'Cuttack, Odisha' },
  { name: 'Prasanna Kumar Pradhan', location: 'Bargarh, Odisha' },
  { name: 'Krushna Chandra Nayak', location: 'Sambalpur, Odisha' },
  { name: 'Sarat Chandra Mohanty', location: 'Balasore, Odisha' },
  { name: 'Jagannath Majhi', location: 'Kalahandi, Odisha' },
  { name: 'Bichitra Nanda Rout', location: 'Ganjam, Odisha' },

  // ── Andhra Pradesh & Telangana ──
  { name: 'Venkat Reddy', location: 'Guntur, Andhra Pradesh' },
  { name: 'Rama Krishna Raju', location: 'West Godavari, Andhra Pradesh' },
  { name: 'Subba Rao Chowdary', location: 'Krishna, Andhra Pradesh' },
  { name: 'Appala Naidu', location: 'Srikakulam, Andhra Pradesh' },
  { name: 'Venkata Ramana Murthy', location: 'Visakhapatnam, Andhra Pradesh' },
  { name: 'Srinivasa Rao Goud', location: 'Kurnool, Andhra Pradesh' },
  { name: 'Narasimha Reddy', location: 'Anantapur, Andhra Pradesh' },
  { name: 'Ravi Teja Varma', location: 'East Godavari, Andhra Pradesh' },
  { name: 'Prasad Rao Naidu', location: 'Nellore, Andhra Pradesh' },
  { name: 'Mallikarjun Rao', location: 'Warangal, Telangana' },
  { name: 'Bhaskar Goud', location: 'Nalgonda, Telangana' },
  { name: 'Tirupati Rao Yadav', location: 'Karimnagar, Telangana' },
  { name: 'Venkataswamy Mudiraj', location: 'Mahabubnagar, Telangana' },
  { name: 'Koteswara Rao', location: 'Khammam, Telangana' },
  { name: 'Rajeshwar Rao Kulkarni', location: 'Nizamabad, Telangana' },
  { name: 'Kompally Chandraiah', location: 'Siddipet, Telangana' },

  // ── Karnataka, Tamil Nadu & Kerala ──
  { name: 'Basavaraj Patil', location: 'Belagavi, Karnataka' },
  { name: 'Shivashankar Gowda', location: 'Mandya, Karnataka' },
  { name: 'Siddaramaiah Hegde', location: 'Shimoga, Karnataka' },
  { name: 'Mallikarjunappa Biradar', location: 'Vijayapura, Karnataka' },
  { name: 'Venkatesh Murthy', location: 'Kolar, Karnataka' },
  { name: 'Chennappa Reddy', location: 'Chikkaballapur, Karnataka' },
  { name: 'Mahadeva Swamy', location: 'Mysuru, Karnataka' },
  { name: 'Somashekhar Pujari', location: 'Dharwad, Karnataka' },
  { name: 'Veeranna Badiger', location: 'Bagalkot, Karnataka' },
  { name: 'Nagendrappa Nayak', location: 'Davangere, Karnataka' },
  { name: 'Muthuvel Karuppasamy', location: 'Coimbatore, Tamil Nadu' },
  { name: 'Palanisamy Gounder', location: 'Erode, Tamil Nadu' },
  { name: 'Selvamani Thevar', location: 'Madurai, Tamil Nadu' },
  { name: 'Sundaram Pillai', location: 'Thanjavur, Tamil Nadu' },
  { name: 'Annadurai Mudaliar', location: 'Salem, Tamil Nadu' },
  { name: 'Murugesan Naicker', location: 'Vellore, Tamil Nadu' },
  { name: 'Senthil Kumar Chettiar', location: 'Dindigul, Tamil Nadu' },
  { name: 'Ramasamy Udayar', location: 'Tiruchirappalli, Tamil Nadu' },
  { name: 'Joseph Matthew', location: 'Wayanad, Kerala' },
  { name: 'Kunjumon Varghese', location: 'Idukki, Kerala' },
  { name: 'Gopalan Nair', location: 'Palakkad, Kerala' },
  { name: 'Sreedharan Nambiar', location: 'Kannur, Kerala' },
  { name: 'Radhakrishnan Menon', location: 'Thrissur, Kerala' },
  { name: 'Mathew Abraham', location: 'Kottayam, Kerala' },

  // ── Muslim Farming Communities Across India ──
  { name: 'Mohammed Rafiq Khan', location: 'Rampur, Uttar Pradesh' },
  { name: 'Zafar Ali Ansari', location: 'Bijnor, Uttar Pradesh' },
  { name: 'Abdul Sattar Malik', location: 'Muzaffarnagar, Uttar Pradesh' },
  { name: 'Farooq Ahmed Mir', location: 'Anantnag, Jammu & Kashmir' },
  { name: 'Ghulam Hassan Bhat', location: 'Baramulla, Jammu & Kashmir' },
  { name: 'Shabir Ahmed Lone', location: 'Shopian, Jammu & Kashmir' },
  { name: 'Munir Khan Pathan', location: 'Bharuch, Gujarat' },
  { name: 'Asif Iqbal Shaikh', location: 'Malegaon, Maharashtra' },
  { name: 'Akhtar Hussain Qureshi', location: 'Akola, Maharashtra' },
  { name: 'Syed Jalaluddin', location: 'Medak, Telangana' },
  { name: 'Mohammad Ismail', location: 'Gulbarga, Karnataka' },
  { name: 'Nazeer Ahmed', location: 'Kurnool, Andhra Pradesh' },
  { name: 'Abdul Rehman', location: 'Purnia, Bihar' },
  { name: 'Sheikh Habibur Rahman', location: 'Malda, West Bengal' },
  { name: 'Noor Mohammed', location: 'Nuh, Haryana' },
  { name: 'Tariq Mehmood', location: 'Poonch, Jammu & Kashmir' },

  // ── North-East Cultivators ──
  { name: 'Biren Chandra Boro', location: 'Kokrajhar, Assam' },
  { name: 'Jadav Payeng', location: 'Jorhat, Assam' },
  { name: 'Hemanta Gogoi', location: 'Dibrugarh, Assam' },
  { name: 'Prabin Saikia', location: 'Nagaon, Assam' },
  { name: 'Lobsang Dorjee', location: 'Tawang, Arunachal Pradesh' },
  { name: 'Tenzing Bhutia', location: 'Gangtok, Sikkim' },
  { name: 'Khemraj Chettri', location: 'Namchi, Sikkim' },
  { name: 'Thangjam Singh', location: 'Imphal East, Manipur' },
  { name: 'Mhonbemo Lotha', location: 'Wokha, Nagaland' },
  { name: 'Lalrinzuala Sailo', location: 'Champhai, Mizoram' },
  { name: 'Pynskhem Marwein', location: 'Shillong, Meghalaya' },
  { name: 'Subrata Debbarma', location: 'Agartala, Tripura' },

  // ── Progressive Women Cultivators (Kisan Didis) ──
  { name: 'Manpreet Kaur', location: 'Patiala, Punjab' },
  { name: 'Jaswinder Kaur', location: 'Jalandhar, Punjab' },
  { name: 'Sunita Rani Devi', location: 'Kurukshetra, Haryana' },
  { name: 'Bimla Devi Dahiya', location: 'Karnal, Haryana' },
  { name: 'Sushila Devi Yadav', location: 'Rewari, Haryana' },
  { name: 'Rekha Bai Patidar', location: 'Khargone, MP' },
  { name: 'Shanta Bai Meena', location: 'Pratapgarh, Rajasthan' },
  { name: 'Saroj Devi Jat', location: 'Churu, Rajasthan' },
  { name: 'Savita Tai Shinde', location: 'Nashik, Maharashtra' },
  { name: 'Vandana Tai Patil', location: 'Sangli, Maharashtra' },
  { name: 'Lakshmi Bai Reddy', location: 'Guntur, Andhra Pradesh' },
  { name: 'Padma Devi Gowda', location: 'Hassan, Karnataka' },
  { name: 'Anjali Boro', location: 'Sonitpur, Assam' },
  { name: 'Nirmala Devi Roy', location: 'Cooch Behar, West Bengal' },
  { name: 'Parvati Murmu', location: 'Mayurbhanj, Odisha' },
  { name: 'Rupa Bai Sahu', location: 'Rajnandgaon, Chhattisgarh' },
  { name: 'Geeta Devi Kushwaha', location: 'Vaishali, Bihar' },
  { name: 'Chanda Devi Sharma', location: 'Bareilly, Uttar Pradesh' },
  { name: 'Bhavna Ben Patel', location: 'Sabarkantha, Gujarat' },
  { name: 'Kamala Ben Vaghela', location: 'Surendranagar, Gujarat' },
];

// ── 16 Current Active Crops of India ──
export const ACTIVE_INDIAN_CROPS = [
  {
    name: 'Wheat (HD-3086)',
    type: 'grain',
    emoji: '🌾',
    price: '₹2,425/q',
    mandi: 'Khanna Mandi',
    tagColor: '#10b981',
  },
  {
    name: 'Basmati Rice (1121)',
    type: 'grain',
    emoji: '🌾',
    price: '₹3,450/q',
    mandi: 'Taraori Mandi',
    tagColor: '#059669',
  },
  {
    name: 'Mustard / Sarson',
    type: 'oilseed',
    emoji: '🟡',
    price: '₹5,680/q',
    mandi: 'Bharatpur APMC',
    tagColor: '#eab308',
  },
  {
    name: 'Bt Cotton (Kapas)',
    type: 'cash',
    emoji: '☁️',
    price: '₹7,150/q',
    mandi: 'Rajkot APMC',
    tagColor: '#06b6d4',
  },
  {
    name: 'Sugarcane',
    type: 'cash',
    emoji: '🎋',
    price: '₹390/q',
    mandi: 'Muzaffarnagar APMC',
    tagColor: '#16a34a',
  },
  {
    name: 'Potato (Kufri Jyoti)',
    type: 'vegetable',
    emoji: '🥔',
    price: '₹1,320/q',
    mandi: 'Agra APMC',
    tagColor: '#d97706',
  },
  {
    name: 'Nashik Red Onion',
    type: 'vegetable',
    emoji: '🧅',
    price: '₹2,180/q',
    mandi: 'Lasalgaon Mandi',
    tagColor: '#ec4899',
  },
  {
    name: 'Soybean (JS-335)',
    type: 'oilseed',
    emoji: '🌱',
    price: '₹4,620/q',
    mandi: 'Indore Mandi',
    tagColor: '#84cc16',
  },
  {
    name: 'Hybrid Maize',
    type: 'grain',
    emoji: '🌽',
    price: '₹2,140/q',
    mandi: 'Davangere APMC',
    tagColor: '#f59e0b',
  },
  {
    name: 'Desi Chana (Chickpea)',
    type: 'pulse',
    emoji: '🟤',
    price: '₹6,150/q',
    mandi: 'Bikaner APMC',
    tagColor: '#b45309',
  },
  {
    name: 'Groundnut (Moongphali)',
    type: 'oilseed',
    emoji: '🥜',
    price: '₹6,480/q',
    mandi: 'Gondal APMC',
    tagColor: '#ca8a04',
  },
  {
    name: 'Red Tomato (Hybrid)',
    type: 'vegetable',
    emoji: '🍅',
    price: '₹1,850/q',
    mandi: 'Kolar APMC',
    tagColor: '#ef4444',
  },
  {
    name: 'Green Chilli (Teja)',
    type: 'spice',
    emoji: '🌶️',
    price: '₹14,200/q',
    mandi: 'Guntur APMC',
    tagColor: '#dc2626',
  },
  {
    name: 'Tur / Arhar Dal',
    type: 'pulse',
    emoji: '🥣',
    price: '₹9,800/q',
    mandi: 'Gulbarga APMC',
    tagColor: '#f97316',
  },
  {
    name: 'Green Moong Dal',
    type: 'pulse',
    emoji: '🟢',
    price: '₹8,250/q',
    mandi: 'Nagaur APMC',
    tagColor: '#10b981',
  },
  {
    name: 'Garlic (Desi Lasun)',
    type: 'spice',
    emoji: '🧄',
    price: '₹12,400/q',
    mandi: 'Mandsaur APMC',
    tagColor: '#8b5cf6',
  },
];

// ── Genuine FarmsKing Agricultural Activity Templates (100% Real Services Only) ──
const ACTIVITY_TEMPLATES = [
  {
    action: (crop: string) => `Checked live APMC market rates for ${crop}`,
    detail: (price: string, mandi: string) => `${price} • ${mandi} daily arrivals`,
    icon: (cropEmoji: string) => cropEmoji,
    color: '#10b981',
  },
  {
    action: (crop: string) => `Scanned ${crop} with AI Crop Doctor`,
    detail: () => 'Pathogen detected • ICAR-calibrated tank dosage prescribed',
    icon: () => '🧪',
    color: '#06b6d4',
  },
  {
    action: (crop: string) => `Ordered 100% Pure Organic Vermicompost`,
    detail: () => 'Certified microbial bio-fertilizer dispatched to doorstep',
    icon: () => '🌱',
    color: '#10b981',
  },
  {
    action: (crop: string) => `Monitored satellite moisture & NDVI for ${crop}`,
    detail: () => 'Canopy health: 98% optimal • 6-constellation telemetry',
    icon: () => '🛰️',
    color: '#0284c7',
  },
  {
    action: (crop: string) => `Listed ${crop} harvest direct on Live Mandi`,
    detail: (price: string) => `Sold directly to verified buyers at ${price} (0% commission)`,
    icon: () => '🌾',
    color: '#059669',
  },
  {
    action: (crop: string) => `Consulted Agronomy Advisor via Helpline`,
    detail: (price: string, mandi: string, crop: string) => `Field nutrition schedule finalized for ${crop}`,
    icon: () => '🩺',
    color: '#14b8a6',
  },
  {
    action: (crop: string) => `Enrolled in Marigold Floriculture Program`,
    detail: () => 'High-yield commercial flower farming 3x-5x profit plan',
    icon: () => '🌼',
    color: '#f59e0b',
  },
  {
    action: () => 'Recorded harvest settlement in Account King digital ledger',
    detail: () => 'Transparent digital bahi-khata voucher saved',
    icon: () => '📑',
    color: '#6366f1',
  },
  {
    action: (crop: string) => `Ordered Certified ${crop} Seeds & Bio-Inputs`,
    detail: () => 'Direct Agri Store dispatch with 100% genuine guarantee',
    icon: () => '📦',
    color: '#f97316',
  },
];

const TIME_AGO_OPTIONS = [
  'Just now',
  '1 min ago',
  '2 mins ago',
  '3 mins ago',
  '4 mins ago',
  '5 mins ago',
  '7 mins ago',
  '10 mins ago',
  '12 mins ago',
  '15 mins ago',
];

/**
 * Generate simulated pan-India farmer activities by cross-multiplying
 * 220+ farmers from all communities with 16 active seasonal crops and genuine services.
 */
export function generateLiveFarmerActivities(count = 2400): LiveFarmerActivity[] {
  const list: LiveFarmerActivity[] = [];
  const farmerLen = PAN_INDIA_FARMERS.length;
  const cropLen = ACTIVE_INDIAN_CROPS.length;
  const actLen = ACTIVITY_TEMPLATES.length;
  const timeLen = TIME_AGO_OPTIONS.length;

  for (let i = 0; i < count; i++) {
    const farmer = PAN_INDIA_FARMERS[i % farmerLen];
    const crop = ACTIVE_INDIAN_CROPS[(i * 3 + Math.floor(i / farmerLen)) % cropLen];
    const template = ACTIVITY_TEMPLATES[(i * 7 + Math.floor(i / cropLen)) % actLen];
    const timeAgo = TIME_AGO_OPTIONS[i % timeLen];

    const actionText = template.action(crop.name);
    const detailText = template.detail(crop.price, crop.mandi, crop.name);
    const itemEmoji = template.icon(crop.emoji);
    const itemColor = template.color || crop.tagColor;

    list.push({
      id: i + 1,
      emoji: itemEmoji,
      name: farmer.name,
      location: farmer.location,
      action: actionText,
      detail: detailText,
      timeAgo,
      tagColor: itemColor,
      isReal: false,
    });
  }

  return list;
}

// ── Persistent Real Farmer Storage & High-Frequency Priority System ──
const REAL_FARMER_STORAGE_KEY = 'farmsking_persistent_real_farmers';

// Default foundational real verified members
const INITIAL_REAL_FARMERS: LiveFarmerActivity[] = [
  {
    id: 'real-seed-1',
    isReal: true,
    emoji: '🌾',
    name: 'Gurnam Singh Ji',
    location: 'Makhu, Ferozepur, Punjab',
    action: 'Verified Mandi Network & Field Quality Lead',
    detail: 'FARMSKING TECHNOLOGIES • General Manager',
    timeAgo: 'Active Member',
    tagColor: '#059669',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'real-seed-2',
    isReal: true,
    emoji: '🚜',
    name: 'Bakshish Singh',
    location: 'Goindwal Sahib, Tarn Taran, Punjab',
    action: 'Registered Corporate Governance Director',
    detail: 'FARMSKING TECHNOLOGIES • Active Cultivator',
    timeAgo: 'Verified Director',
    tagColor: '#10b981',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'real-seed-3',
    isReal: true,
    emoji: '🌼',
    name: 'Sudhir Kumar Mahato',
    location: 'Makhu, Punjab',
    action: 'Consulted Floriculture Desk for Marigold Blueprints',
    detail: 'Floriculture Promotion Partner & Testing Advisor',
    timeAgo: 'Verified Advisor',
    tagColor: '#f59e0b',
    createdAt: Date.now() - 10800000,
  },
  {
    id: 'real-seed-4',
    isReal: true,
    emoji: '🌱',
    name: 'Manjeet Sra',
    location: 'Punjab',
    action: 'Dispatched Certified Vermicompost Bio-Fertilizer Lot',
    detail: 'Organic Products & Soil Microbiology Manager',
    timeAgo: 'Verified Manager',
    tagColor: '#047857',
    createdAt: Date.now() - 14400000,
  },
];

let cachedRealFarmers: LiveFarmerActivity[] | null = null;

export function getPersistentRealFarmers(): LiveFarmerActivity[] {
  if (typeof window === 'undefined') {
    return cachedRealFarmers || INITIAL_REAL_FARMERS;
  }

  try {
    const raw = localStorage.getItem(REAL_FARMER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedRealFarmers = parsed;
        return parsed;
      }
    }
    // Initialize with foundational records if empty
    localStorage.setItem(REAL_FARMER_STORAGE_KEY, JSON.stringify(INITIAL_REAL_FARMERS));
    cachedRealFarmers = INITIAL_REAL_FARMERS;
    return INITIAL_REAL_FARMERS;
  } catch {
    return cachedRealFarmers || INITIAL_REAL_FARMERS;
  }
}

/**
 * Record a new real farmer action permanently.
 * Real farmers are never deleted, never randomized, and permanently reflected.
 */
export function recordRealFarmerActivity(item: {
  name: string;
  location?: string;
  action?: string;
  detail?: string;
  emoji?: string;
  tagColor?: string;
}): LiveFarmerActivity {
  const newActivity: LiveFarmerActivity = {
    id: `real-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    isReal: true,
    emoji: item.emoji || '🌾',
    name: item.name.trim(),
    location: item.location?.trim() || 'Punjab, India',
    action: item.action?.trim() || 'Joined FarmsKing Verified Farmer Network',
    detail: item.detail?.trim() || 'Verified Real Farmer • Direct Member',
    timeAgo: 'Just now',
    tagColor: item.tagColor || '#059669',
    createdAt: Date.now(),
  };

  const existing = getPersistentRealFarmers();
  // Check if identical farmer already registered recently to prevent exact duplicate flooding
  const filtered = existing.filter(
    (e) => !(e.name.toLowerCase() === newActivity.name.toLowerCase() && e.action === newActivity.action)
  );

  const updated = [newActivity, ...filtered];
  cachedRealFarmers = updated;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(REAL_FARMER_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('farmsking_real_farmer_updated', { detail: newActivity }));
    } catch {}
  }

  return newActivity;
}

/**
 * Merge Real Farmers into the notification feed with High-Frequency Priority.
 * Real farmers are permanently reflected and interleaved prominently ("usnu jyada show kro").
 */
export function getUnifiedLiveFarmerFeed(): LiveFarmerActivity[] {
  const simulated = generateLiveFarmerActivities(2400);
  const realFarmers = getPersistentRealFarmers();

  if (realFarmers.length === 0) return simulated;

  const result: LiveFarmerActivity[] = [];
  let simIdx = 0;
  let realIdx = 0;

  // Interleave real farmers frequently: 1 Real Farmer every 2 items!
  while (simIdx < simulated.length) {
    // Add real farmer
    const currentReal = realFarmers[realIdx % realFarmers.length];
    result.push({
      ...currentReal,
      timeAgo: currentReal.createdAt
        ? calculateDynamicTimeAgo(currentReal.createdAt)
        : currentReal.timeAgo,
    });
    realIdx++;

    // Add 1-2 simulated activities
    if (simIdx < simulated.length) result.push(simulated[simIdx++]);
    if (simIdx < simulated.length) result.push(simulated[simIdx++]);
  }

  return result;
}

function calculateDynamicTimeAgo(timestamp: number): string {
  const diffMins = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Pre-generated static live feed instance
export const LIVE_FARMER_ACTIVITIES: LiveFarmerActivity[] = getUnifiedLiveFarmerFeed();

