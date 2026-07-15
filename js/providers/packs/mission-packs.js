const pack=(id,capabilities)=>Object.freeze({id,capabilities:Object.freeze(capabilities)});
export const MISSION_PACKS=Object.freeze({
  travel:pack("travel",["flight.search","accommodation.search","restaurant.search","transport.place_search","weather.forecast","currency.exchange","country.information","destination.information","travel.checklist"]),
  entertainment:pack("entertainment",["event.search","movie.search","accommodation.search","restaurant.search","transport.place_search","calendar.schedule"]),
  shopping:pack("shopping",["product.search","product.compare","product.availability","delivery.estimate","warranty.information"]),
  services:pack("services",["service.search","service.compare","service.availability","service.estimate"]),
  learning:pack("learning",["tutor.search","tutor.compare","tutor.availability","course.search","language_exchange.search"]),
  relocation:pack("relocation",["visa.information","housing.search","flight.search","insurance.compare","utilities.setup","country.information"])
});
export const getMissionPack=id=>MISSION_PACKS[id]||MISSION_PACKS.services;
