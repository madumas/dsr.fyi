import Maker from '@makerdao/dai';
import McdPlugin from '@makerdao/dai-plugin-mcd'

export default async function createMaker(network = 'mainnet') {
  return Maker.create('http',
      {
          url: 'ws://vpn.0xna.me:8546/', //'ws://192.168.0.23:8546'//'https://mainnet.infura.io/v3/e37b6b6fede24263907500a81762f2ca',
          plugins: [
              [McdPlugin, {}] // the second argument can be used to pass options to the plugin
          ],
          accounts: {

          }
      });
}
