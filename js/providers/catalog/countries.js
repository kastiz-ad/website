const country=(code,name,priority,currency,languages=[])=>Object.freeze({code,name,priority,currency,languages});
export const SUPPORTED_COUNTRIES=Object.freeze([
  country("KR","Republic of Korea",1,"KRW",["ko","en"]),country("JP","Japan",2,"JPY",["ja","en"]),country("VN","Vietnam",2,"VND",["vi","en"]),country("TH","Thailand",2,"THB",["th","en"]),country("PH","Philippines",2,"PHP",["en","fil"]),country("HK","Hong Kong",2,"HKD",["zh","en"]),country("TW","Taiwan",2,"TWD",["zh","en"]),country("SG","Singapore",2,"SGD",["en","zh"]),
  country("US","United States",3,"USD",["en"]),country("CA","Canada",3,"CAD",["en","fr"]),country("AU","Australia",3,"AUD",["en"]),country("GB","United Kingdom",3,"GBP",["en"]),country("FR","France",3,"EUR",["fr","en"]),country("DE","Germany",3,"EUR",["de","en"]),country("ES","Spain",3,"EUR",["es","en"]),country("IT","Italy",3,"EUR",["it","en"])
]);
export const getCountry=code=>SUPPORTED_COUNTRIES.find(country=>country.code===String(code||"").toUpperCase());
