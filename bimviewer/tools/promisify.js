'use strict';
/*create by fenglin on 2019/4/12.*/

module.exports = (api) => {
  return (option,params) => {
      return new Promise((resolve,reject) => {
         api(Object.assign({},option,{success:resolve,fail:reject}),params);
      });
  }
};