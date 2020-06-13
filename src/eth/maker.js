import Maker from '@makerdao/dai';
import McdPlugin from '@makerdao/dai-plugin-mcd'

export default async function createMaker() {
  return Maker.create('http',
      {
          url: process.env.REACT_APP_INFURAURL,
          plugins: [
              [McdPlugin, {}] // the second argument can be used to pass options to the plugin
          ],
          accounts: {

          }
      });
}
