import { Link } from '@/components/button/paper';
import { MenuItem } from '@/components/menu/Menu';
import { Clipboard } from '@/layouts/Clipboard';
import { useAPI } from '@/services/query/hooks';
import { useVariable } from '@alveusgg/backstage';
import { useSuspenseQuery } from '@tanstack/react-query';
import { FC } from 'react';

export const Status: FC = () => {
  const api = useAPI();
  const apiBaseUrl = useVariable('apiBaseUrl');
  const response = useSuspenseQuery({
    queryKey: ['status'],
    queryFn: () => {
      return api.chat.status.query();
    }
  });

  return (
    <div className="flex flex-col w-full bg-accent-100 gap-5 p-12 overflow-y-scroll">
      <nav className="w-full mx-auto max-w-3xl py-2 border-b-2 border-dotted border-accent-800 border-opacity-20">
        <h2 className="text-3xl font-bold text-accent-800">Critters & Plants</h2>
      </nav>
      <Clipboard
        container={{
          initial: {
            y: 20,
            scale: 1.03
          },
          animate: {
            y: 0,
            scale: 1
          }
        }}
        className="pt-24 px-6 @lg:px-12 pb-12 text-accent-800"
      >
        <h2 className="text-2xl font-bold p-2">Status</h2>
        <p className="p-2">
          Cursus volutpat molestie lectus odio. Condimentum facilisis vestibulum arcu nascetur. Quam duis ut justo
          adipiscing. Felis justo iaculis dignissim hendrerit vitae eu sodales ultrices dolor. Lectus euismod sodales
          enim lacus placerat purus vestibulum.
        </p>
        <p className="p-2">
          Cursus volutpat molestie lectus odio. Condimentum facilisis vestibulum arcu nascetur. Quam duis ut justo
          adipiscing. Felis justo iaculis dignissim hendrerit vitae eu sodales ultrices dolor. Lectus euismod sodales
          enim lacus placerat purus vestibulum.
        </p>
        <p className="p-2">
          Cursus volutpat molestie lectus odio. Condimentum facilisis vestibulum arcu nascetur. Quam duis ut justo
          adipiscing. Felis justo iaculis dignissim hendrerit vitae eu sodales ultrices dolor. Lectus euismod sodales
          enim lacus placerat purus vestibulum.
        </p>
        <p className="p-2">
          Cursus volutpat molestie lectus odio. Condimentum facilisis vestibulum arcu nascetur. Quam duis ut justo
          adipiscing. Felis justo iaculis dignissim hendrerit vitae eu sodales ultrices dolor. Lectus euismod sodales
          enim lacus placerat purus vestibulum.
        </p>
        <p className="p-2">
          Cursus volutpat molestie lectus odio. Condimentum facilisis vestibulum arcu nascetur. Quam duis ut justo
          adipiscing. Felis justo iaculis dignissim hendrerit vitae eu sodales ultrices dolor. Lectus euismod sodales
          enim lacus placerat purus vestibulum.
        </p>
        <p className="p-2">
          Cursus volutpat molestie lectus odio. Condimentum facilisis vestibulum arcu nascetur. Quam duis ut justo
          adipiscing. Felis justo iaculis dignissim hendrerit vitae eu sodales ultrices dolor. Lectus euismod sodales
          enim lacus placerat purus vestibulum.
        </p>
        <p className="p-2">
          Cursus volutpat molestie lectus odio. Condimentum facilisis vestibulum arcu nascetur. Quam duis ut justo
          adipiscing. Felis justo iaculis dignissim hendrerit vitae eu sodales ultrices dolor. Lectus euismod sodales
          enim lacus placerat purus vestibulum.
        </p>
        <p className="p-2">
          Cursus volutpat molestie lectus odio. Condimentum facilisis vestibulum arcu nascetur. Quam duis ut justo
          adipiscing. Felis justo iaculis dignissim hendrerit vitae eu sodales ultrices dolor. Lectus euismod sodales
          enim lacus placerat purus vestibulum.
        </p>
        <p className="p-2">
          Cursus volutpat molestie lectus odio. Condimentum facilisis vestibulum arcu nascetur. Quam duis ut justo
          adipiscing. Felis justo iaculis dignissim hendrerit vitae eu sodales ultrices dolor. Lectus euismod sodales
          enim lacus placerat purus vestibulum.
        </p>
        <p className="p-2">
          Cursus volutpat molestie lectus odio. Condimentum facilisis vestibulum arcu nascetur. Quam duis ut justo
          adipiscing. Felis justo iaculis dignissim hendrerit vitae eu sodales ultrices dolor. Lectus euismod sodales
          enim lacus placerat purus vestibulum.
        </p>
        <p className="p-2">
          Cursus volutpat molestie lectus odio. Condimentum facilisis vestibulum arcu nascetur. Quam duis ut justo
          adipiscing. Felis justo iaculis dignissim hendrerit vitae eu sodales ultrices dolor. Lectus euismod sodales
          enim lacus placerat purus vestibulum.
        </p>
        <p className="p-2">
          Cursus volutpat molestie lectus odio. Condimentum facilisis vestibulum arcu nascetur. Quam duis ut justo
          adipiscing. Felis justo iaculis dignissim hendrerit vitae eu sodales ultrices dolor. Lectus euismod sodales
          enim lacus placerat purus vestibulum.
        </p>
        <MenuItem>
          <Link target="_blank" to={`${apiBaseUrl}/admin/signin`}>
            Sign in as chat account
          </Link>
        </MenuItem>
      </Clipboard>
    </div>
  );
};
